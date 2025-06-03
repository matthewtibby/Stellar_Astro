import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { projectId } = req.query;
  const { frameType } = req.query;
  if (!projectId || !frameType) {
    res.status(400).json({ error: 'Missing projectId or frameType' });
    return;
  }
  // Construct the path to the preview image
  const previewPath = path.join(process.cwd(), 'project_data', String(projectId), 'previews', `master_${frameType}.png`);
  if (fs.existsSync(previewPath)) {
    res.setHeader('Content-Type', 'image/png');
    fs.createReadStream(previewPath).pipe(res);
  } else {
    res.status(404).json({ error: 'Preview not found' });
  }
} 