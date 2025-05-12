import os
from supabase import create_client, Client
from astroquery.simbad import Simbad
import json
import re
import time

def normalize_alias(alias):
    # Strip and replace multiple spaces with a single space
    return re.sub(r'\s+', ' ', alias.strip())

def enrich_targets():
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.')
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Configure Simbad to return all IDs
    Simbad.ROW_LIMIT = 0
    Simbad.add_votable_fields('ids')

    # Helper to classify IDs
    def classify_ids(ids):
        catalog_ids = []
        common_names = []
        for id_ in ids:
            if id_.startswith(('NGC', 'IC', 'M', 'C', 'PGC', 'UGC', 'ESO', '2MASS', 'SDSS', 'WISE', 'IRAS', 'HIP', 'HD', 'SAO', 'TYC', 'GSC', 'LBN', 'LDN', 'Barnard', 'Sh2', 'vdB', 'B', 'L', 'Cr', 'Tr', 'Mel', 'Berkeley', 'Stock', 'Collinder', 'Alessi', 'King', 'Czernik', 'Ruprecht', 'Harvard', 'Basel', 'Haffner', 'Pismis', 'Roslund', 'Turner', 'Teutsch', 'FSR', 'MWSC', 'KPR2004b', 'KPS2012')):
                catalog_ids.append(id_)
            else:
                common_names.append(id_)
        return catalog_ids, common_names

    # Fetch all projects
    projects = supabase.table('projects').select('id, target').execute().data
    for project in projects:
        target = project.get('target')
        if not target:
            continue
        # Try all possible aliases for Simbad query, normalized
        queries = [target.get('name'), target.get('id')] + target.get('catalogIds', []) + target.get('commonNames', [])
        queries = [normalize_alias(q) for q in queries if q]
        found = False
        for q in queries:
            print(f"[SIMBAD DEBUG] Querying: '{q}'")
            custom_simbad = Simbad()
            custom_simbad.add_votable_fields('ids')
            custom_simbad.add_votable_fields('ra', 'dec')
            custom_simbad.add_votable_fields('galdim_majaxis', 'galdim_minaxis')
            result = custom_simbad.query_object(q)
            print(f"[SIMBAD DEBUG] Result for '{q}': {result}")
            print(f"[SIMBAD DEBUG] Type: {type(result)}, Repr: {repr(result)}")
            time.sleep(1)
            if result is not None and len(result) > 0:
                ids = result['ids'][0].split('|')
                catalog_ids, common_names = classify_ids([id_.strip() for id_ in ids])
                ra = result['ra'][0]
                dec = result['dec'][0]
                coordinates = {'ra': ra, 'dec': dec}
                # Fetch angular size if available
                major = result['galdim_majaxis'][0] if 'galdim_majaxis' in result.colnames else None
                minor = result['galdim_minaxis'][0] if 'galdim_minaxis' in result.colnames else None
                if major is not None and minor is not None:
                    target['angularSize'] = {'major': float(major), 'minor': float(minor)}
                target['catalogIds'] = catalog_ids
                target['commonNames'] = common_names
                target['coordinates'] = coordinates
                supabase.table('projects').update({'target': target}).eq('id', project['id']).execute()
                print(f"Updated project {project['id']} with {len(catalog_ids)} catalogIds, {len(common_names)} commonNames, coordinates {coordinates}, and angular size (maj, min): {major}, {minor}.")
                found = True
                break
            else:
                print(f"[SIMBAD DEBUG] No rows returned for '{q}'")
        if not found:
            print(f"No SIMBAD result for any alias of project {project['id']}")
    print('Alias and coordinate enrichment complete.')

if __name__ == "__main__":
    enrich_targets() 