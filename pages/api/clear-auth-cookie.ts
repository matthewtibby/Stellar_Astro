import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', 'sb-wxannuklwbocdheqhmbx-auth-token=deleted; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
  res.status(200).json({ cleared: true });
} 