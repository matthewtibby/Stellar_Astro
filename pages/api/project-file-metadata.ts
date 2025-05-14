import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { simbadLookup } from '@/src/lib/server/astro-processing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const { projectId, field, value } = req.body;
  if (!projectId || !field) return res.status(400).json({ error: 'projectId and field required' });

  // If editing equipment, update all files in the project
  if (['telescope', 'camera', 'filter'].includes(field)) {
    // Get all files for the project
    const { data: files, error: findError } = await supabase
      .from('project_files')
      .select('id, metadata')
      .eq('project_id', projectId);
    if (findError || !files || files.length === 0) return res.status(404).json({ error: 'No files found for project' });
    // Update metadata for all files
    const updates = files.map(file => ({
      id: file.id,
      metadata: { ...file.metadata, [field]: value }
    }));
    const { data: updated, error: updateError } = await supabase
      .from('project_files')
      .upsert(updates, { onConflict: 'id' })
      .select();
    if (updateError) return res.status(500).json({ error: updateError.message });
    return res.status(200).json({ files: updated });
  }

  // For object name, update only the main file and enrich with SIMBAD
  const { data: files, error: findError } = await supabase
    .from('project_files')
    .select('id, metadata')
    .eq('project_id', projectId)
    .limit(1);
  if (findError || !files || files.length === 0) return res.status(404).json({ error: 'No file found for project' });
  const file = files[0];
  let newMetadata = { ...file.metadata, [field]: value };

  // If editing the object name, call SIMBAD and enrich metadata
  if (field === 'object') {
    const simbad = await simbadLookup(value);
    if (simbad && simbad.ra && simbad.dec) {
      newMetadata = {
        ...newMetadata,
        ra: simbad.ra,
        dec: simbad.dec,
        objectType: simbad.type,
        simbadMainId: simbad.mainId,
      };
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('project_files')
    .update({ metadata: newMetadata })
    .eq('id', file.id)
    .select()
    .single();
  if (updateError) return res.status(500).json({ error: updateError.message });
  return res.status(200).json({ file: updated });
} 