# 🎯 EduFlow — Interview Preparation Guide

## Project Explanation (30-second pitch)

> "I built EduFlow — a production-ready full-stack EdTech platform built on a microservices architecture. It features a **NestJS REST API** backed by **PostgreSQL + Prisma ORM**, a **Next.js 14 frontend** with SSR and Tailwind, a **FastAPI recommendation engine** using a hybrid TF-IDF + collaborative filtering algorithm, **Meilisearch** for full-text search, and **Redis** for caching. The system can detect skill gaps, generate personalized recommendations, track learning progress, and issue certificates — all containerized with Docker."

---

## 🏗️ Key Design Decisions

### 1. Why Microservices?
- **Separation of concerns**: FastAPI handles ML (Python ecosystem), NestJS handles business logic
- **Independent scaling**: Scale recommendation service separately during peak times
- **Language flexibility**: Python for ML, TypeScript for REST API
- **Resilience**: If reco service is down, we fallback to popular courses

### 2. Why Prisma over raw SQL / TypeORM?
- Type-safe database access with TypeScript auto-completion
- Schema-as-code migrations prevent drift
- Supports complex relations without n+1 queries using `include`
- Easy schema evolution with `prisma migrate dev`

### 3. Why TF-IDF for content-based filtering?
- No cold-start problem like collaborative filtering — works even with 0 user history
- Computationally efficient for O(n×d) matrix where n=courses, d=vocabulary
- Course text (title, description, tags, skills) is high-signal metadata
- Fast cosine similarity lookup: O(1) after matrix precomputed

### 4. Why co-occurrence collaborative filtering over SVD/ALS?
- **Simplicity**: Easier to debug and explain in interviews
- **Scalability**: No matrix factorization needed — O(u×c) pivot table
- **Implicit feedback**: Uses watch/enroll events, not explicit ratings
- For production: Would upgrade to ALS (Implicit library) or neural CF

### 5. Why Meilisearch over Elasticsearch?
- Much simpler setup and configuration
- Built-in typo tolerance and ranking
- 10x faster for typical EdTech search workloads
- REST-native API, no separate query DSL needed

### 6. Why Redis caching?
- Cache recommendations (recompute every 30 min)
- Cache search results for popular queries
- Session storage for refresh tokens
- Rate limiting with sliding window algorithm

---

## 🔑 Key Features Deep-Dive

### JWT Authentication Flow
```
1. User logs in → server validates credentials
2. Server generates 2 tokens:
   - Access token (short-lived: 15 min)
   - Refresh token (long-lived: 30 days)
3. Refresh token is hashed (bcrypt) and stored in DB
4. Client sends access token in Authorization header
5. When expired → call /auth/refresh with refresh token
6. On logout → invalidate refresh token in DB (server-side revocation)
```

### Recommendation Pipeline
```
1. User watches lessons → Interaction events logged async
2. FastAPI reads interaction table from PostgreSQL
3. Trains:
   a. TF-IDF matrix on course metadata (title, desc, tags, skills)
   b. User-course pivot matrix with weighted interactions
4. Content-based: cosine_sim(user_avg_vector, all_courses)
5. Collaborative: similarity with other users, aggregate their courses
6. Hybrid: 60% content + 40% collaborative score blend
7. Returns ranked course IDs → NestJS fetches full details from DB
```

### Event Tracking Architecture
```
User Action → NestJS Controller → InteractionsService.log()
           → PostgreSQL interactions table
           → FastAPI reads on next retrain cycle
```

### Progress & Completion Logic
```
lessonComplete = watchedSeconds >= duration * 0.8 (80% threshold)
courseComplete = completedLessons === totalLessons
  → Update enrollment status to COMPLETED
  → Award skills (insert UserSkill rows)
  → Issue certificate (generate PDF in production)
```

---

## ❓ Common Interview Questions

### System Design

**Q: How would you scale this to 1 million users?**
> - **Horizontal scaling**: Deploy multiple NestJS instances behind a load balancer (AWS ALB)
> - **Database**: Use PostgreSQL read replicas for read-heavy operations; connection pooling with PgBouncer
> - **Cache**: Redis cluster for distributed caching; cache course listings, search results
> - **CDN**: Serve video content via CloudFront or Cloudflare
> - **Recommendation**: Move from in-memory matrix to offline batch job (Spark/Dask) hourly; cache results in Redis
> - **Search**: Meilisearch cluster or migrate to Elasticsearch for petabyte scale

**Q: How do you prevent race conditions in enrollment?**
> Use a unique constraint on `(userId, courseId)` in the database, so duplicate enrollments throw a constraint error. For payment-heavy flows, use a distributed lock (Redis SETNX) to prevent double-charging.

**Q: How would you implement real-time notifications?**
> Add Socket.IO or Server-Sent Events to NestJS. Use a Redis pub/sub channel: when a course is completed, publish to channel; WebSocket server subscribes and pushes to the right client by userId.

### ML/Algorithm

**Q: What is TF-IDF and why did you use it?**
> TF-IDF (Term Frequency-Inverse Document Frequency) measures how important a word is to a document relative to a corpus.
> - **TF** = word count in document / total words
> - **IDF** = log(total docs / docs containing word)
> - **Why**: Downweights common words ("the", "course"), upweights unique keywords ("transformer", "kubernetes")
> - **Cosine similarity** measures the angle between two course vectors — 1.0 = identical, 0 = unrelated

**Q: What are the limitations of your recommender?**
> 1. **Cold start**: New users with no history get popular courses (not personalized)
> 2. **Popularity bias**: Collaborative filtering tends to recommend popular courses
> 3. **Social filter bubble**: Users see courses similar to what they already know
> 4. **Retraining lag**: Model retrained on schedule, not real-time
> **Improvements**: Use neural collaborative filtering, add diversity penalty, real-time feature store

**Q: How does skill-gap analysis work?**
> 1. Define required skills for each target role (hardcoded map, or from a skills ontology API)
> 2. Extract skills the user has from their completed courses' `CourseSkill` records
> 3. Compute set difference: `missing = required_skills - user_skills`
> 4. Use TF-IDF to find courses whose "skills soup" is most similar to the missing skills text
> 5. Return ranked bridge courses

### Backend/Architecture

**Q: Why did you choose NestJS over Express?**
> NestJS enforces SOLID principles through its module/controller/service architecture with dependency injection. Built-in support for decorators, Swagger, guards, interceptors. Scales well with large teams because it enforces structure.

**Q: How does your Prisma schema handle many-to-many relationships?**
> Via explicit junction tables: `CourseSkill`, `UserSkill`. This gives us extra fields (like `level` in UserSkill or metadata in junction). Prisma's `@@id([a, b])` creates a composite primary key.

**Q: How would you add payments (Stripe)?**
> 1. Create `payments` table with Stripe paymentIntentId
> 2. On "Enroll Now" click: create PaymentIntent via Stripe API
> 3. Frontend confirms with Stripe.js
> 4. Stripe webhook `payment_intent.succeeded` → NestJS endpoint → create Enrollment
> 5. This ensures idempotency: enrollment only created after confirmed payment

### Frontend

**Q: Why use Zustand over Redux?**
> Zustand is simpler, less boilerplate, and sufficient for our auth state management. No action creators, reducers, or dispatchers needed. Built-in persist middleware for localStorage. Redux would be overkill for our state requirements.

**Q: How does the search implement autocomplete?**
> On keypress (debounced 300ms): call `/search?q=query&limit=5` which queries Meilisearch. Meilisearch returns results in <10ms with highlighting. Results shown in dropdown. On selection, navigate to course detail page.

---

## 📊 Complexity Analysis

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| TF-IDF similarity | O(d) per query | d = vocabulary size (5000) |
| Course recommendation | O(n) | n = number of courses |
| Collaborative filtering (train) | O(u × c) | u = users, c = courses |
| User recommendation | O(u) | Linear scan of user similarities |
| Search (Meilisearch) | O(1) per query | Indexed inverted index |
| Course enrollment | O(1) | Single DB write |
| Progress update | O(1) | Upsert by unique index |
| Course completion check | O(l) | l = lessons in course |

---

## 🚩 Red Flags to Avoid in Interviews

1. Don't say "it's just CRUD" — explain the ML and event-driven parts
2. Don't forget to mention fallback strategies (graceful degradation)
3. Do mention database indexes on `email`, `slug`, `courseId`, `userId`
4. Mention you'd add rate limiting (already done with ThrottlerModule)
5. Mention horizontal scalability — stateless API design (JWT not sessions)

---

## 🎤 Demo Script (for live demos)

1. Register as a new student
2. Search for "Python" → show Meilisearch results
3. View course detail → show curriculum, enrollment card
4. Enroll in "Python for Data Science"
5. Go to learn page → play lesson, mark complete
6. Visit dashboard → show progress bar
7. Navigate to "Recommended for You" → explain hybrid algorithm
8. Show Swagger docs at `localhost:4000/api/docs`
9. Show FastAPI docs at `localhost:8000/docs`
