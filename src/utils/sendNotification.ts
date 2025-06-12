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
  req: unknown, // NextApiRequest or similar
  eventType: keyof typeof notificationEvents,
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  data?: unknown,
}) {
  if (!shouldNotify(eventType)) return;
  let origin = '';
  let authorization = '';
  if (typeof req === 'object' && req !== null && 'headers' in req) {
    const headers = (req as { headers?: { origin?: string; authorization?: string } }).headers;
    origin = headers?.origin || '';
    authorization = headers?.authorization || '';
  }
  await fetch(`${origin}/api/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body: JSON.stringify({
      type,
      message,
      data,
      eventType,
    }),
  });
} 