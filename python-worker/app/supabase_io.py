from dotenv import load_dotenv
import os
import httpx
# Always load .env.local from the project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../'))
env_path = os.path.join(project_root, '.env.local')
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
print("SUPABASE_URL:", SUPABASE_URL)
print("SUPABASE_SERVICE_KEY:", SUPABASE_KEY)
from supabase import create_client, Client

# Create an httpx client with a longer timeout for large file uploads
httpx_client = httpx.Client(timeout=120.0)  # 2 minutes
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def download_file(bucket: str, path: str, local_path: str):
    res = supabase.storage.from_(bucket).download(path)
    with open(local_path, "wb") as f:
        f.write(res)

def upload_file(bucket: str, path: str, local_path: str, public: bool = False):
    with open(local_path, "rb") as f:
        supabase.storage.from_(bucket).upload(path, f)
    if public:
        url = supabase.storage.from_(bucket).get_public_url(path)
        return url
    return None

def get_public_url(bucket: str, path: str):
    return supabase.storage.from_(bucket).get_public_url(path)

def list_files(bucket: str, prefix: str):
    print(f"[DEBUG] Listing files in bucket '{bucket}' with prefix '{prefix}'")
    files = supabase.storage.from_(bucket).list(prefix)
    print(f"[DEBUG] Found files: {[f['name'] for f in files]}")
    return files

def delete_file(bucket: str, path: str):
    """Delete a file from Supabase storage."""
    try:
        result = supabase.storage.from_(bucket).remove([path])
        print(f"[DEBUG] Delete result for {path}: {result}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to delete file {path} from bucket {bucket}: {e}")
        return False 