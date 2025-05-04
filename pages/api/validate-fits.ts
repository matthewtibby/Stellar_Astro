import { NextApiRequest, NextApiResponse } from 'next';
import { FITSParser } from 'jsfitsio';
import formidable, { File as FormidableFile } from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface FITSValidationResult {
  isValid: boolean;
  warnings: string[];
  metadata: {
    exposureTime?: number;
    gain?: number;
    temperature?: number;
    filter?: string;
    observationDate?: string;
    frameType?: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const uploadedFile = (files.file as FormidableFile[])?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Check file size (max 500MB)
    const stats = await fs.stat(uploadedFile.filepath);
    if (stats.size > 500 * 1024 * 1024) {
      return res.status(400).json({
        isValid: false,
        warnings: ['File size exceeds 500MB limit'],
        metadata: {}
      });
    }

    const parser = new FITSParser(uploadedFile.filepath);
    const fits = await parser.loadFITS();
    
    if (!fits) {
      return res.status(400).json({
        isValid: false,
        warnings: ['Failed to parse FITS file'],
        metadata: {}
      });
    }

    const header = fits.header;
    const result: FITSValidationResult = {
      isValid: true,
      warnings: [],
      metadata: {}
    };

    // Check required keywords
    const requiredKeywords = ['NAXIS', 'NAXIS1', 'NAXIS2', 'BITPIX'];
    for (const keyword of requiredKeywords) {
      if (!header.has(keyword)) {
        result.warnings.push(`Missing required keyword: ${keyword}`);
        result.isValid = false;
      }
    }

    // Extract metadata
    if (header.has('EXPTIME')) result.metadata.exposureTime = header.get('EXPTIME');
    if (header.has('GAIN')) result.metadata.gain = header.get('GAIN');
    if (header.has('CCD-TEMP')) result.metadata.temperature = header.get('CCD-TEMP');
    if (header.has('FILTER')) result.metadata.filter = header.get('FILTER');
    if (header.has('DATE-OBS')) result.metadata.observationDate = header.get('DATE-OBS');

    // Determine frame type from metadata
    if (header.has('IMAGETYP')) {
      result.metadata.frameType = header.get('IMAGETYP').toLowerCase();
    } else {
      const filename = uploadedFile.originalFilename || '';
      result.metadata.frameType = getFrameTypeFromFilename(filename);
      result.warnings.push('Frame type determined from filename, IMAGETYP keyword missing');
    }

    // Clean up the temporary file
    await fs.unlink(uploadedFile.filepath);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error validating FITS file:', error);
    return res.status(500).json({
      isValid: false,
      warnings: ['Error validating FITS file'],
      metadata: {}
    });
  }
}

function getFrameTypeFromFilename(filename: string): string {
  filename = filename.toLowerCase();
  if (filename.includes('light')) return 'light';
  if (filename.includes('dark')) return 'dark';
  if (filename.includes('flat')) return 'flat';
  if (filename.includes('bias')) return 'bias';
  return 'unknown';
} 