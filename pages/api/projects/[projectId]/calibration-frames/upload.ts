import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import type { File as FormidableFile } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('File upload error:', err);
      console.error('Fields:', fields);
      console.error('Files:', files);
      return res.status(400).json({ error: 'File upload error' });
    }
    // Handle both File and File[]
    let file = files.file as FormidableFile | FormidableFile[];
    if (Array.isArray(file)) file = file[0];
    if (!file) {
      console.error('No file received:', files);
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const frameId = `${file.originalFilename || 'frame'}_${Date.now()}`;
    const type = fields.type
      ? Array.isArray(fields.type) ? fields.type[0] : fields.type
      : 'bias'; // default for test
    const metadataField = fields.metadata;
    let metadata: unknown = { mock: true };
    if (metadataField) {
      const metadataStr = Array.isArray(metadataField) ? metadataField[0] : metadataField;
      try {
        metadata = JSON.parse(metadataStr as string);
      } catch (e) {
        console.error('Failed to parse metadata:', metadataStr, e);
        metadata = { mock: true };
      }
    }
    res.status(200).json({
      id: frameId,
      file_url: `http://localhost:3000/mock/path/${frameId}`,
      metadata,
      type,
    });
  });
} 
