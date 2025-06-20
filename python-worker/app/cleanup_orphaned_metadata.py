import asyncio
import os
import json
from supabase import create_client
import asyncpg

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
BUCKET = os.getenv('SUPABASE_BUCKET', 'raw-frames')
DB_URL = os.getenv('DATABASE_URL')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def main():
    conn = await asyncpg.connect(DB_URL)
    rows = await conn.fetch("SELECT file_path FROM fits_metadata")
    print(f"Checking {len(rows)} metadata entries...")
    removed = 0
    for row in rows:
        file_path = row['file_path']
        try:
            res = supabase.storage.from_(BUCKET).list(path="/".join(file_path.split('/')[:-1]))
            files = [f['name'] for f in res['data'] or []]
            fname = file_path.split('/')[-1]
            if fname not in files:
                print(f"[REMOVE] {file_path} (not found in storage)")
                await conn.execute("DELETE FROM fits_metadata WHERE file_path = $1", file_path)
                removed += 1
        except Exception as e:
            print(f"[ERROR] {file_path}: {e}")
    await conn.close()
    print(f"Done. Removed {removed} orphaned metadata entries.")

if __name__ == "__main__":
    asyncio.run(main()) 