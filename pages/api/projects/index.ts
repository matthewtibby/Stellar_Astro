import { NextApiRequest, NextApiResponse } from 'next';
import { getDashboardProjects } from '@/src/lib/server/getDashboardProjects';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }
  try {
    const projects = await getDashboardProjects(userId);
    res.status(200).json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
} 