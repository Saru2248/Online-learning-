# 🎓 EduFlow — Online Learning & Course Recommendation Platform

> A production-ready, full-stack microservices EdTech platform inspired by Coursera & Udemy, featuring AI-powered course recommendations, real-time progress tracking, and a beautiful modern UI.

![EduFlow Platform](./docs/banner.png)

---

## 📌 Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Recommendation Engine](#recommendation-engine)
- [Screenshots](#screenshots)
- [Interview Questions](#interview-questions)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**EduFlow** is an enterprise-grade online learning platform that delivers personalized course recommendations using a hybrid ML engine (TF-IDF content-based + collaborative filtering). The system is built on a **microservices architecture** separating concerns across a Next.js frontend, NestJS REST API, FastAPI ML service, Meilisearch full-text search, Redis cache, and PostgreSQL.

### Why This Matters in EdTech
- The global e-learning market is valued at **$400B+** and growing
- Personalization increases course completion rates by **up to 50%**
- Skill-gap detection enables learners to find the right next course
- Real-time progress tracking keeps learners accountable

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   ┌──────────────────────────────────────────────┐             │
│   │      Next.js 14 Frontend (Port 3000)          │             │
│   │  (App Router, Tailwind CSS, React Query)      │             │
│   └───────────────────┬──────────────────────────┘             │
└───────────────────────│─────────────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼─────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│   ┌──────────────────────────────────────────────┐             │
│   │      NestJS API (Port 4000)                   │             │
│   │  Auth | Courses | Enrollment | Progress       │             │
│   │  Prisma ORM → PostgreSQL                      │             │
│   └─────┬──────────────┬────────────────┬─────────┘             │
│         │              │                │                        │
│    Redis Cache   Meilisearch      FastAPI Reco                   │
│    (Port 6379)  (Port 7700)      (Port 8000)                    │
└─────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                      DATA LAYER                                 │
│         PostgreSQL (Port 5432)  |  Redis (Port 6379)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Core Features
- 🔐 **JWT Authentication** — Register, login, refresh tokens, role-based access (student/instructor/admin)
- 📚 **Course Management** — Create, edit, publish courses with lessons, videos, and resources
- 📝 **Enrollment System** — Course enrollment with payment foundation
- 📊 **Progress Tracking** — Lesson-by-lesson progress with completion percentages
- ⭐ **Rating & Reviews** — 5-star rating system with text reviews
- 🔍 **Full-text Search** — Meilisearch powered with filters (level, skills, tags)
- ❤️ **Wishlist** — Save courses for later
- 🎓 **Certificates** — Auto-generated on course completion
- 📝 **Quizzes** — Section-level quiz system with scoring
- 👤 **User Dashboard** — Enrolled courses, progress, achievements

### AI/ML Recommendation Engine
- 🤖 **Content-Based Filtering** — TF-IDF similarity on course metadata
- 👥 **Collaborative Filtering** — Co-occurrence matrix from user interactions
- 🎯 **Skill-Gap Analysis** — Identifies missing skills and recommends bridge courses
- 📈 **Trending Courses** — Based on recent interaction velocity

### Advanced Features
- 📡 **Event Tracking** — view, enroll, watch, complete, rate events
- 🔄 **Real-time Updates** — Progress sync across devices
- 📧 **Email Notifications** — Enrollment confirmation, certificate delivery
- 🐳 **Docker Ready** — Full docker-compose setup
- 🔒 **Security** — Helmet, CORS, rate limiting, input validation

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, React Query, Zustand |
| **Backend API** | NestJS, TypeScript, Prisma ORM, JWT |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 |
| **Search** | Meilisearch |
| **ML Service** | FastAPI, Python 3.11, scikit-learn, pandas |
| **Container** | Docker, Docker Compose |
| **Auth** | Passport.js, bcrypt, JWT |

---

## 📁 Project Structure

```
online-learning/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   ├── api/          # NestJS backend API
│   └── reco/         # FastAPI ML recommendation service
├── infra/
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── .env.example
├── docs/             # Architecture docs, API specs
├── README.md
└── package.json      # Root workspace config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/eduflow.git
cd eduflow
```

### 2. Start Infrastructure Services
```bash
cd infra
docker-compose up -d postgres redis meilisearch
```

### 3. Setup Backend API
```bash
cd apps/api
cp .env.example .env        # Configure environment variables
npm install
npx prisma migrate dev      # Run database migrations
npx prisma db seed          # Seed sample data
npm run start:dev           # Starts on port 4000
```

### 4. Setup Frontend
```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev                 # Starts on port 3000
```

### 5. Setup Recommendation Service
```bash
cd apps/reco
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 6. Run Everything with Docker
```bash
cd infra
docker-compose up --build
```

Access: `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend (`apps/api/.env`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/eduflow"
REDIS_URL="redis://localhost:6379"
MEILISEARCH_URL="http://localhost:7700"
MEILISEARCH_KEY="masterKey"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
RECO_SERVICE_URL="http://localhost:8000"
PORT=4000
```

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Recommendation Service (`apps/reco/.env`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/eduflow"
API_URL="http://localhost:4000"
```

---

## 📡 API Documentation

Once running, visit `http://localhost:4000/api/docs` for Swagger UI.

### Key Endpoints
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| GET | `/courses` | List all courses |
| GET | `/courses/:id` | Course details |
| POST | `/enrollments` | Enroll in course |
| GET | `/progress/:courseId` | Get progress |
| POST | `/progress` | Update progress |
| GET | `/recommendations/user/:userId` | Personal recommendations |
| GET | `/search?q=query` | Search courses |

---

## 🤖 Recommendation Engine

### Content-Based (TF-IDF)
- Builds TF-IDF matrix from course title, description, skills, tags
- Computes cosine similarity between courses
- Returns top-N similar courses for `/recommend/similar`

### Collaborative Filtering (Co-occurrence)
- Builds user-course interaction matrix
- Uses co-occurrence of courses across users
- Recommends courses that similar users enrolled in

### Skill-Gap Analysis
- Compares user's current skills (from completed courses)
- Against target job role skill requirements
- Recommends bridge courses for missing skills

---

## 📸 Screenshots

| Page | Description |
|------|------------|
| ![Home]() | Personalized home with AI recommendations |
| ![Courses]() | Course listing with search & filters |
| ![Detail]() | Course detail with syllabus & instructor |
| ![Player]() | Video player with progress tracking |
| ![Dashboard]() | Student dashboard with progress stats |

---

## 👔 Interview Questions & Answers

See [docs/INTERVIEW_PREP.md](./docs/INTERVIEW_PREP.md) for comprehensive Q&A covering:
- System design decisions
- Microservices communication patterns
- ML recommendation algorithms
- Database schema choices
- Performance optimizations

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  Built with ❤️ for the EdTech community | Star ⭐ if this helped you!
</div>
#   O n l i n e - l e a r n i n g -  
 