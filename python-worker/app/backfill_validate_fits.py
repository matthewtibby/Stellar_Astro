import os
import asyncio
from astropy.io import fits
from supabase import create_client
import json
from fits_analysis import analyze_fits_headers
from db import init_db, get_db
from supabase_io import list_files, download_file

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
BUCKET = os.getenv('SUPABASE_BUCKET', 'raw-frames')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def save_fits_metadata(file_path, project_id, user_id, metadata):
    conn = await get_db()
    try:
        await conn.execute(
            """
            insert into fits_metadata (file_path, project_id, user_id, metadata)
            values ($1, $2, $3, $4)
            on conflict (file_path) do update set metadata = $4
            """,
            file_path, project_id, user_id, json.dumps(metadata)
        )
    finally:
        await conn.close()

def get_project_user_from_path(path):
    # Assumes path like user_id/project_id/frame_type/filename
    parts = path.split('/')
    if len(parts) < 4:
        return None, None, None
    return parts[0], parts[1], parts[2]

def recursive_list_fits(bucket, prefix=''):
    # Recursively list all .fit/.fits files in the bucket, returning full paths
    all_files = []
    items = list_files(bucket, prefix)
    for item in items:
        name = item['name']
        # Build the full path for this item
        full_path = name if not prefix else f"{prefix}/{name}"
        if name.lower().endswith(('.fit', '.fits')):
            all_files.append(full_path)
        elif not name.lower().endswith(('.png', '.jpg', '.jpeg')) and not '.' in os.path.basename(name):
            # Likely a folder, recurse
            all_files.extend(recursive_list_fits(bucket, full_path))
    return all_files

def main():
    print(f"Recursively listing all FITS files in bucket '{BUCKET}'...")
    fits_files = recursive_list_fits(BUCKET, '')
    print(f"Found {len(fits_files)} FITS files.")
    summary = {}
    for path in fits_files:
        user_id, project_id, frame_type = get_project_user_from_path(path)
        if not user_id or not project_id:
            print(f"[SKIP] Could not parse user/project from {path}")
            continue
        local_path = f"/tmp/{os.path.basename(path)}"
        try:
            download_file(BUCKET, path, local_path)
            with fits.open(local_path) as hdul:
                header = hdul[0].header
                analysis = analyze_fits_headers(header)
                is_valid = analysis.confidence >= 0.7 and not any('Missing' in w or 'must' in w for w in analysis.warnings)
                metadata = analysis.metadata
                metadata['frame_type'] = analysis.type
                metadata['valid'] = is_valid
                if not is_valid:
                    metadata['rejection_reason'] = '; '.join(analysis.warnings)
                asyncio.run(save_fits_metadata(path, project_id, user_id, metadata))
                key = f"{frame_type or 'unknown'}"
                if key not in summary:
                    summary[key] = {'used': 0, 'rejected': 0}
                if is_valid:
                    summary[key]['used'] += 1
                else:
                    summary[key]['rejected'] += 1
                print(f"[{'OK' if is_valid else 'REJECT'}] {path} ({analysis.type})")
        except Exception as e:
            print(f"[ERROR] {path}: {e}")
    print("\nSummary:")
    for k, v in summary.items():
        print(f"{k}: {v['used']} used, {v['rejected']} rejected")

if __name__ == "__main__":
    main() 