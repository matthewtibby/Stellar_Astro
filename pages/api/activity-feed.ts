import type { NextApiRequest, NextApiResponse } from 'next';

const ACTIVITY_FEED_ENABLED = process.env.ACTIVITY_FEED_ENABLED !== 'false';

// Mock data for demonstration
const mockFeed = [
  {
    group: 'Yesterday',
    items: [
      {
        id: '1',
        user_id: 'user1',
        project_id: 'proj1',
        project_name: 'NGC 1893',
        type: 'project',
        action: 'created',
        details: { target: 'NGC 1893' },
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '2',
        user_id: 'user2',
        project_id: 'proj1',
        project_name: 'NGC 1893',
        type: 'file',
        action: 'uploaded',
        details: { file: 'Light_001.fit' },
        created_at: new Date(Date.now() - 86300000).toISOString(),
      },
    ],
  },
  {
    group: 'Today',
    items: [
      {
        id: '3',
        user_id: 'user1',
        project_id: 'proj1',
        project_name: 'NGC 1893',
        type: 'calibration',
        action: 'calibration',
        details: { method: 'median' },
        created_at: new Date().toISOString(),
      },
    ],
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ACTIVITY_FEED_ENABLED) {
    res.status(200).json({ feed: [] });
    return;
  }
  res.status(200).json({ feed: mockFeed });
} 