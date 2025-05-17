import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
print(f"Database URL: {DATABASE_URL}")  # Debug print

async def init_db():
    # Create database connection
    print(f"Connecting to database with URL: {DATABASE_URL}")  # Debug print
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Create fits_metadata table if it doesn't exist
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS fits_metadata (
            file_path TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            metadata JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    await conn.close()

async def get_db():
    return await asyncpg.connect(DATABASE_URL) 