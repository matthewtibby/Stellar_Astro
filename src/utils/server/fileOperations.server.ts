// This file contains server-side only code
'use server';

import { promises as fs } from 'fs';
import path from 'path';

export async function readFitsFile(filePath: string): Promise<Buffer> {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid filePath');
  }
  return await fs.readFile(filePath);
}

export async function getFileMetadata(filePath: string): Promise<{
  size: number;
  name: string;
  extension: string;
}> {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid filePath');
  }
  const stats = await fs.stat(filePath);
  return {
    size: stats.size,
    name: path.basename(filePath),
    extension: path.extname(filePath)
  };
} 