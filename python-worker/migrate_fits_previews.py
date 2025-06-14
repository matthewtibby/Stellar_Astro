import os
import io
from astropy.io import fits
import numpy as np
from PIL import Image
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
BUCKET = "raw-frames"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_png_preview(fits_bytes, downsample_to=512):
    with fits.open(io.BytesIO(fits_bytes)) as hdul:
        data = hdul[0].data.astype(np.float32)
        if data.shape[0] > downsample_to or data.shape[1] > downsample_to:
            factor = max(data.shape[0] // downsample_to, data.shape[1] // downsample_to)
            data = data[::factor, ::factor]
        vmin, vmax = np.percentile(data, [0.1, 99.9])
        data = np.clip(data, vmin, vmax)
        norm = (data - vmin) / (vmax - vmin) * 255
        norm = np.nan_to_num(norm)
        img = Image.fromarray(norm.astype(np.uint8), mode='L')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return buf.read()

def list_all_files_recursive(prefix=''):
    all_files = []
    resp = supabase.storage.from_(BUCKET).list(prefix, {'limit': 10000})
    if isinstance(resp, dict) and 'data' in resp:
        entries = resp['data']
    elif isinstance(resp, list):
        entries = resp
    else:
        raise RuntimeError(f"Unexpected response from supabase.storage.list: {resp}")
    for entry in entries:
        if entry.get('id') is None and entry.get('name') and not entry['name'].lower().endswith(('.fits', '.fit', '.png')):
            # It's a folder
            sub_prefix = f"{prefix}{entry['name']}/" if prefix else f"{entry['name']}/"
            all_files.extend(list_all_files_recursive(sub_prefix))
        else:
            entry['full_path'] = f"{prefix}{entry['name']}" if prefix else entry['name']
            all_files.append(entry)
    return all_files

def migrate_previews():
    print("Recursively listing all files in bucket...")
    files = list_all_files_recursive()
    fits_files = [f for f in files if f['name'].lower().endswith(('.fits', '.fit'))]
    png_files = set(f['full_path'] for f in files if f['name'].lower().endswith('.png'))
    print(f"Found {len(fits_files)} FITS files, {len(png_files)} PNG previews.")
    for file in fits_files:
        png_name = file['name'].rsplit('.', 1)[0] + '.png'
        png_full_path = file['full_path'].rsplit('.', 1)[0] + '.png'
        if png_full_path in png_files:
            print(f"[SKIP] Preview exists for {file['full_path']}")
            continue
        print(f"[MIGRATE] Generating preview for {file['full_path']}")
        fits_bytes = supabase.storage.from_(BUCKET).download(file['full_path'])
        png_bytes = generate_png_preview(fits_bytes)
        supabase.storage.from_(BUCKET).upload(png_full_path, png_bytes, {'content-type': 'image/png'})
        print(f"[DONE] Uploaded preview {png_full_path}")

if __name__ == '__main__':
    migrate_previews() 