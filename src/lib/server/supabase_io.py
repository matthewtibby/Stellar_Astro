from dotenv import load_dotenv
import os
# Always load .env.local from the project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../'))
env_path = os.path.join(project_root, '.env.local')
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
print("SUPABASE_URL:", SUPABASE_URL)
print("SUPABASE_SERVICE_KEY:", SUPABASE_KEY)
from supabase import create_client, Client

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