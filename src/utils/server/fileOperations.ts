import { readFile } from 'fs/promises';
import path from 'path';

export async function readFitsFile(filePath: string): Promise<Buffer> {
  return await readFile(filePath);
}

export async function getFileMetadata(filePath: string): Promise<{
  size: number;
  name: string;
  extension: string;
}> {
  const stats = await readFile(filePath);
  return {
    size: stats.length,
    name: path.basename(filePath),
    extension: path.extname(filePath)
  };
} 