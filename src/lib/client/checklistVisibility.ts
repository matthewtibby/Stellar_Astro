import { supabase } from '@/src/lib/supabaseClient';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Fetch checklist visibility for a user and route.
 * Returns true (visible) by default if not set.
 */
export async function getChecklistVisibility(userId: string, route: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase env vars');
    return true;
  }
  const url = `${SUPABASE_URL}/rest/v1/checklist_visibility?select=visible&user_id=eq.${userId}&route=eq.${encodeURIComponent(route)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    console.error('Error fetching checklist visibility:', res.status, await res.text());
    return true;
  }
  const data = await res.json();
  return data?.[0]?.visible ?? true;
}

/**
 * Set checklist visibility for a user and route.
 */
export async function setChecklistVisibility(userId: string, route: string, visible: boolean): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase env vars');
    return;
  }
  const url = `${SUPABASE_URL}/rest/v1/checklist_visibility?on_conflict=user_id,route`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ user_id: userId, route, visible, updated_at: new Date().toISOString() }]),
  });
  if (!res.ok) {
    console.error('Error setting checklist visibility:', res.status, await res.text());
  }
} 