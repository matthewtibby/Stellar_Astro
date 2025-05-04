import { NextApiRequest, NextApiResponse } from 'next';
import { readFitsFile } from '@/src/utils/server/fileOperations.server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { operation, filePath } = req.body;

    switch (operation) {
      case 'readFile':
        const fileContent = await readFitsFile(filePath);
        return res.status(200).json({ content: fileContent });
      
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    console.error('File operation failed:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 