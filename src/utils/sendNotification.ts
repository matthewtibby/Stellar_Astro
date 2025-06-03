// Use this helper for all backend notification events. Pass req from the API context (e.g., NextApiRequest) to ensure correct headers and origin.
// Example usage: await sendNotification({ req, eventType: 'system_alert', type: 'warning', message: 'System maintenance scheduled.' });
import { shouldNotify, notificationEvents } from './notificationConfig';

export async function sendNotification({
  req,
  eventType,
  type,
  message,
  data = {},
}: {
<<<<<<< HEAD
  req: any, // NextApiRequest or similar
  eventType: keyof typeof notificationEvents,
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  data?: any,
=======
  req: unknown, // NextApiRequest or similar
  eventType: keyof typeof notificationEvents,
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  data?: unknown,
>>>>>>> calibration
}) {
  if (!shouldNotify(eventType)) return;
  await fetch(`${req.headers.origin || ''}/api/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
    body: JSON.stringify({
      type,
      message,
      data,
      eventType,
    }),
  });
} 