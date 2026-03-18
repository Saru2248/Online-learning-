# ─────────────────────────────────────────────────────────────────────
#  Recommendations Router — FastAPI endpoints
# ─────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional

router = APIRouter()


# GET /recommend/user?user_id=xxx&limit=10
@router.get("/user")
async def recommend_for_user(
    request: Request,
    user_id: str = Query(..., description="User ID from PostgreSQL"),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get personalized course recommendations for a user.
    Uses hybrid content-based + collaborative filtering.
    Falls back to popular courses if user has no history.
    """
    recommender = request.app.state.recommender
    if not recommender.is_trained:
        raise HTTPException(status_code=503, detail="Recommender not ready")

    recommendations = recommender.get_user_recommendations(user_id, limit)
    return {
        "user_id": user_id,
        "count": len(recommendations),
        "recommendations": recommendations,
    }


# GET /recommend/similar?course_id=xxx&limit=6
@router.get("/similar")
async def recommend_similar(
    request: Request,
    course_id: str = Query(..., description="Course ID to find similar courses for"),
    limit: int = Query(6, ge=1, le=20),
):
    """
    Get courses similar to a given course using TF-IDF cosine similarity.
    Powers the "You might also like" section.
    """
    recommender = request.app.state.recommender
    if not recommender.is_trained:
        raise HTTPException(status_code=503, detail="Recommender not ready")

    if course_id not in recommender.course_idx:
        raise HTTPException(status_code=404, detail="Course not found in model")

    recommendations = recommender.get_similar_courses(course_id, limit)
    return {
        "course_id": course_id,
        "count": len(recommendations),
        "recommendations": recommendations,
    }


# GET /recommend/skillgap?user_id=xxx&target_role=data_scientist&limit=8
@router.get("/skillgap")
async def recommend_skillgap(
    request: Request,
    user_id: str = Query(..., description="User ID"),
    target_role: str = Query(
        ...,
        description="Target job role (e.g., data_scientist, full_stack_developer)",
    ),
    limit: int = Query(8, ge=1, le=20),
):
    """
    Skill-gap analysis: identifies which skills the user is missing for a target role
    and recommends courses to bridge those gaps.

    Supported roles:
    - data_scientist
    - full_stack_developer
    - devops_engineer
    - machine_learning_engineer
    - backend_developer
    """
    recommender = request.app.state.recommender
    if not recommender.is_trained:
        raise HTTPException(status_code=503, detail="Recommender not ready")

    result = recommender.get_skillgap_recommendations(user_id, target_role, limit)
    return {
        "user_id": user_id,
        "target_role": target_role,
        **result,
    }


# GET /recommend/trending
@router.get("/trending")
async def recommend_trending(
    request: Request,
    limit: int = Query(8, ge=1, le=30),
):
    """
    Get trending courses based on recent interaction velocity.
    Model-agnostic — uses interaction counts from last 7 days.
    """
    from database import get_db_connection
    conn = await get_db_connection()
    try:
        rows = await conn.fetch(
            """
            SELECT "courseId", COUNT(*) as interaction_count
            FROM interactions
            WHERE "createdAt" > NOW() - INTERVAL '7 days'
              AND "courseId" IS NOT NULL
            GROUP BY "courseId"
            ORDER BY interaction_count DESC
            LIMIT $1
            """,
            limit,
        )
        return {
            "trending": [
                {"course_id": r["courseId"], "score": r["interaction_count"]}
                for r in rows
            ]
        }
    finally:
        await conn.close()
