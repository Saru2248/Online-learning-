# ─────────────────────────────────────────────────────────────────────
#  EduFlow Recommendation Service
#  Framework: FastAPI + Python 3.11
#  Algorithm: Hybrid (Content-Based TF-IDF + Collaborative Filtering)
# ─────────────────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from routers import recommend
from database import engine
from recommender import HybridRecommender

# ─── Global recommender instance ──────────────────────────────────────
recommender = HybridRecommender()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load and train the recommender on startup"""
    print("🤖 Training recommendation models...")
    await recommender.train()
    print("✅ Recommender ready")
    yield
    print("🔌 Shutting down recommender")

# ─── FastAPI App ────────────────────────────────────────────────────────
app = FastAPI(
    title="EduFlow Recommendation Engine",
    description="Hybrid ML-based course recommendation service",
    version="1.0.0",
    docs_url="/docs",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Attach recommender to app state ──────────────────────────────────
app.state.recommender = recommender

# ─── Include Routers ──────────────────────────────────────────────────
app.include_router(recommend.router, prefix="/recommend", tags=["recommendations"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "EduFlow Recommendation Engine"}


@app.post("/retrain")
async def retrain():
    """Trigger model retraining (call after new data)"""
    await app.state.recommender.train()
    return {"message": "Model retrained successfully"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
