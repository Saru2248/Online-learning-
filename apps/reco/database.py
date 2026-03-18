# ─────────────────────────────────────────────────────────────────────
#  Database connection — asyncpg for PostgreSQL
# ─────────────────────────────────────────────────────────────────────

import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/eduflow")


async def get_db_connection():
    """Get a single asyncpg connection"""
    return await asyncpg.connect(DATABASE_URL)
