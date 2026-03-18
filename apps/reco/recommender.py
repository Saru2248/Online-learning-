# ─────────────────────────────────────────────────────────────────────
#  Hybrid Recommender Engine
#
#  Approach 1: Content-Based Filtering (TF-IDF cosine similarity)
#    - Builds TF-IDF matrix on course title, description, tags, skills
#    - For a given course: finds most similar courses by cosine similarity
#    - For a user: averages vectors of their watched courses
#
#  Approach 2: Collaborative Filtering (co-occurrence matrix)
#    - Builds implicit feedback matrix (user × course) from interactions
#    - Finds courses popular among users who interacted with same courses
#
#  Hybrid: weighted blend of both scores
# ─────────────────────────────────────────────────────────────────────

import asyncio
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Optional
from database import get_db_connection
import json
import logging

logger = logging.getLogger(__name__)


class HybridRecommender:
    def __init__(self):
        self.courses_df: Optional[pd.DataFrame] = None
        self.interactions_df: Optional[pd.DataFrame] = None
        self.tfidf_matrix = None
        self.cosine_sim = None
        self.course_idx: Dict[str, int] = {}   # course_id → matrix index
        self.idx_course: Dict[int, str] = {}   # index → course_id
        self.user_course_matrix: Optional[pd.DataFrame] = None
        self.is_trained = False

        # TF-IDF vectorizer config
        self.tfidf = TfidfVectorizer(
            max_features=5000,
            stop_words="english",
            ngram_range=(1, 2),  # Unigrams + bigrams
        )

        # Job role → required skills mapping for skill-gap
        self.role_skills = {
            "data_scientist": [
                "python", "machine learning", "statistics", "tensorflow",
                "pandas", "numpy", "sql", "data visualization",
            ],
            "full_stack_developer": [
                "javascript", "react", "nodejs", "sql", "html", "css",
                "restapi", "docker", "git",
            ],
            "devops_engineer": [
                "docker", "kubernetes", "ci/cd", "linux", "aws",
                "terraform", "ansible", "python",
            ],
            "machine_learning_engineer": [
                "python", "pytorch", "tensorflow", "mlops", "docker",
                "sql", "machine learning", "deep learning",
            ],
            "backend_developer": [
                "python", "nodejs", "java", "sql", "restapi",
                "microservices", "docker", "redis",
            ],
        }

    # ─── Train / Retrain all models ──────────────────────────────────
    async def train(self):
        """Load data from DB and train both models"""
        try:
            await self._load_data()
            self._train_content_based()
            self._train_collaborative()
            self.is_trained = True
            logger.info(
                f"✅ Models trained: {len(self.courses_df)} courses, "
                f"{len(self.interactions_df)} interactions"
            )
        except Exception as e:
            logger.error(f"❌ Training failed: {e}")
            # Don't crash — gracefully degrade
            self.is_trained = False

    # ─── Load data from PostgreSQL ───────────────────────────────────
    async def _load_data(self):
        conn = await get_db_connection()
        try:
            # Load all published courses
            courses_rows = await conn.fetch(
                """
                SELECT
                  c.id,
                  c.title,
                  c.description,
                  c."shortDesc",
                  c.tags,
                  c.level,
                  c."avgRating",
                  c."totalStudents",
                  c."categoryId",
                  COALESCE(
                    json_agg(s.name) FILTER (WHERE s.name IS NOT NULL),
                    '[]'
                  ) AS skills
                FROM courses c
                LEFT JOIN course_skills cs ON c.id = cs."courseId"
                LEFT JOIN skills s ON cs."skillId" = s.id
                WHERE c.status = 'PUBLISHED'
                GROUP BY c.id
                """
            )

            # Load interaction events
            interactions_rows = await conn.fetch(
                """
                SELECT "userId", "courseId", type, "createdAt"
                FROM interactions
                WHERE "courseId" IS NOT NULL
                  AND type IN ('ENROLL', 'COMPLETE', 'WATCH', 'RATE')
                ORDER BY "createdAt" DESC
                LIMIT 500000
                """
            )

            self.courses_df = pd.DataFrame([dict(r) for r in courses_rows])
            self.interactions_df = pd.DataFrame([dict(r) for r in interactions_rows])

        finally:
            await conn.close()

    # ─── Train content-based model (TF-IDF) ──────────────────────────
    def _train_content_based(self):
        if self.courses_df is None or self.courses_df.empty:
            return

        # Build "soup" text for each course
        def build_soup(row):
            title = str(row.get("title", "")) * 3  # Weight title 3×
            desc = str(row.get("description", ""))
            tags = " ".join(row.get("tags", []) or [])
            skills = " ".join(
                json.loads(row["skills"])
                if isinstance(row["skills"], str)
                else (row["skills"] or [])
            )
            level = str(row.get("level", ""))
            return f"{title} {desc} {tags} {skills} {level}"

        self.courses_df["soup"] = self.courses_df.apply(build_soup, axis=1)

        # Fit TF-IDF and compute cosine similarity matrix
        self.tfidf_matrix = self.tfidf.fit_transform(self.courses_df["soup"])
        self.cosine_sim = cosine_similarity(self.tfidf_matrix, self.tfidf_matrix)

        # Build index lookups
        self.course_idx = {
            course_id: idx
            for idx, course_id in enumerate(self.courses_df["id"])
        }
        self.idx_course = {v: k for k, v in self.course_idx.items()}

        logger.info(f"Content-based matrix: {self.tfidf_matrix.shape}")

    # ─── Train collaborative filtering (co-occurrence) ────────────────
    def _train_collaborative(self):
        if self.interactions_df is None or self.interactions_df.empty:
            return

        # Weight interactions by type
        weights = {"ENROLL": 5, "COMPLETE": 10, "WATCH": 1, "RATE": 7}
        self.interactions_df["weight"] = self.interactions_df["type"].map(
            lambda t: weights.get(t, 1)
        )

        # Build user-course implicit feedback matrix
        try:
            self.user_course_matrix = self.interactions_df.pivot_table(
                index="userId",
                columns="courseId",
                values="weight",
                aggfunc="sum",
                fill_value=0,
            )
            logger.info(
                f"Collaborative matrix: {self.user_course_matrix.shape}"
            )
        except Exception as e:
            logger.warning(f"Could not build collab matrix: {e}")

    # ─── Content-based: similar courses ──────────────────────────────
    def get_similar_courses(
        self, course_id: str, limit: int = 6, exclude_ids: List[str] = None
    ) -> List[Dict]:
        if not self.is_trained or course_id not in self.course_idx:
            return []

        idx = self.course_idx[course_id]
        sim_scores = list(enumerate(self.cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        # Exclude the query course itself
        exclude = set([course_id] + (exclude_ids or []))
        results = []

        for i, score in sim_scores[1:]:  # Skip index 0 (itself)
            cid = self.idx_course.get(i)
            if cid and cid not in exclude:
                results.append({"course_id": cid, "score": float(score)})
                if len(results) >= limit:
                    break

        return results

    # ─── Personalized recommendations ────────────────────────────────
    def get_user_recommendations(
        self, user_id: str, limit: int = 10
    ) -> List[Dict]:
        if not self.is_trained:
            return []

        content_recs = self._content_based_for_user(user_id)
        collab_recs = self._collaborative_for_user(user_id)

        # Hybrid blend: 60% content + 40% collaborative
        score_map: Dict[str, float] = {}

        for rec in content_recs:
            score_map[rec["course_id"]] = score_map.get(rec["course_id"], 0) + rec["score"] * 0.6

        for rec in collab_recs:
            score_map[rec["course_id"]] = score_map.get(rec["course_id"], 0) + rec["score"] * 0.4

        # Sort by blended score
        sorted_recs = sorted(score_map.items(), key=lambda x: x[1], reverse=True)

        return [
            {"course_id": cid, "score": round(score, 4)}
            for cid, score in sorted_recs[:limit]
        ]

    def _content_based_for_user(self, user_id: str) -> List[Dict]:
        """Average TF-IDF vectors of user's interacted courses"""
        if self.user_course_matrix is None or user_id not in self.user_course_matrix.index:
            return []

        user_row = self.user_course_matrix.loc[user_id]
        interacted = user_row[user_row > 0].index.tolist()

        if not interacted:
            return []

        # Get indices of interacted courses
        valid_indices = [
            self.course_idx[cid]
            for cid in interacted
            if cid in self.course_idx
        ]

        if not valid_indices:
            return []

        # Average their TF-IDF vectors
        user_vector = np.mean(
            self.tfidf_matrix[valid_indices].toarray(), axis=0
        ).reshape(1, -1)

        sim_scores = cosine_similarity(user_vector, self.tfidf_matrix)[0]
        interacted_set = set(interacted)

        results = []
        for idx, score in enumerate(sim_scores):
            cid = self.idx_course.get(idx)
            if cid and cid not in interacted_set and score > 0.01:
                results.append({"course_id": cid, "score": float(score)})

        return sorted(results, key=lambda x: x["score"], reverse=True)[:30]

    def _collaborative_for_user(self, user_id: str) -> List[Dict]:
        """Co-occurrence collaborative filtering"""
        if self.user_course_matrix is None or user_id not in self.user_course_matrix.index:
            return []

        user_row = self.user_course_matrix.loc[user_id].values
        user_interacted = set(
            self.user_course_matrix.columns[user_row > 0].tolist()
        )

        # Compute similarity with all other users (cosine)
        user_matrix = self.user_course_matrix.values
        user_idx = self.user_course_matrix.index.tolist().index(user_id)
        user_vector = user_matrix[user_idx].reshape(1, -1)

        similarities = cosine_similarity(user_vector, user_matrix)[0]

        # Top-20 similar users
        similar_user_indices = np.argsort(similarities)[::-1][1:21]

        # Accumulate their course scores
        course_scores: Dict[str, float] = {}
        for sim_idx in similar_user_indices:
            sim_weight = similarities[sim_idx]
            if sim_weight <= 0:
                continue
            similar_user_courses = self.user_course_matrix.iloc[sim_idx]
            for cid, val in similar_user_courses.items():
                if cid not in user_interacted and val > 0:
                    course_scores[cid] = course_scores.get(cid, 0) + val * sim_weight

        sorted_courses = sorted(
            course_scores.items(), key=lambda x: x[1], reverse=True
        )

        return [
            {"course_id": cid, "score": float(score)}
            for cid, score in sorted_courses[:30]
        ]

    # ─── Skill-gap analysis ───────────────────────────────────────────
    def get_skillgap_recommendations(
        self, user_id: str, target_role: str, limit: int = 8
    ) -> Dict:
        """
        1. Get required skills for the target role
        2. Get user's existing skills (from DB via interaction history)
        3. Find missing skills
        4. Recommend courses that teach missing skills
        """
        if not self.is_trained:
            return {"missing_skills": [], "recommendations": []}

        # Normalize role name
        role_key = target_role.lower().replace(" ", "_")
        required_skills = self.role_skills.get(role_key, [])

        if not required_skills:
            return {"missing_skills": [], "recommendations": [], "error": f"Unknown role: {target_role}"}

        # Get user's skill soup from courses they interacted with
        if (
            self.user_course_matrix is not None
            and user_id in self.user_course_matrix.index
        ):
            user_row = self.user_course_matrix.loc[user_id]
            interacted_courses = user_row[user_row > 0].index.tolist()
        else:
            interacted_courses = []

        # Get skills from interacted courses
        user_skills = set()
        if interacted_courses and self.courses_df is not None:
            user_courses_df = self.courses_df[
                self.courses_df["id"].isin(interacted_courses)
            ]
            for _, row in user_courses_df.iterrows():
                skills = row.get("skills", []) or []
                if isinstance(skills, str):
                    try:
                        skills = json.loads(skills)
                    except Exception:
                        skills = []
                user_skills.update([s.lower() for s in skills])

        # Compute missing skills
        missing_skills = [
            skill for skill in required_skills if skill.lower() not in user_skills
        ]

        if not missing_skills:
            return {"missing_skills": [], "recommendations": [], "message": "All skills acquired!"}

        # Find courses that teach missing skills using content-based similarity
        # Build a query vector from missing skills text
        query_text = " ".join(missing_skills)
        try:
            query_vector = self.tfidf.transform([query_text])
            sim_scores = cosine_similarity(query_vector, self.tfidf_matrix)[0]

            interacted_set = set(interacted_courses)
            results = []
            for idx, score in enumerate(sim_scores):
                cid = self.idx_course.get(idx)
                if cid and cid not in interacted_set and score > 0.01:
                    results.append({"course_id": cid, "score": float(score)})

            sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)[:limit]
        except Exception as e:
            logger.error(f"Skill-gap recommendation error: {e}")
            sorted_results = []

        return {
            "missing_skills": missing_skills,
            "user_has_skills": list(user_skills),
            "recommendations": sorted_results,
        }
