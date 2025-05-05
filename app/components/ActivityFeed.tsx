import React, { useState, useEffect } from 'react';

interface ActivityFeedItem {
  id: string;
  user_id: string;
  project_id: string;
  project_name?: string;
  type: string;
  action: string;
  details: any;
  created_at: string;
  [key: string]: any;
}

interface ActivityFeedGroup {
  group: string;
  items: ActivityFeedItem[];
}

interface FetchActivityFeedParams {
  eventType: string;
  project: string;
  dateRange: string;
  jwt: string;
}

const filterOptions = {
  eventType: ['All', 'Created', 'Uploaded', 'Calibration', 'Stacked', 'Deleted', 'Invited'],
  project: ['All'], // Will be populated dynamically
  dateRange: ['Today', 'Yesterday', 'Last 7 days', 'This Month'],
};

const actionIcons: Record<string, string> = {
  created: '📁',
  uploaded: '📥',
  calibration: '✅',
  stacked: '🗂️',
  deleted: '🗑️',
  invited: '👤',
  default: '📝',
};

function getEventIcon(action: string) {
  return actionIcons[action?.toLowerCase()] || actionIcons.default;
}

function getEventDescription(item: ActivityFeedItem) {
  // Compose a human-friendly description
  const project = item.project_name ? `in "${item.project_name}"` : '';
  switch (item.action?.toLowerCase()) {
    case 'created':
      return `Created project "${item.project_name || item.project_id}"`;
    case 'uploaded':
      return `Uploaded files ${project}`;
    case 'calibration':
      return `Calibration completed ${project}`;
    case 'stacked':
      return `Stacked frames ${project}`;
    case 'deleted':
      return `Deleted file(s) ${project}`;
    case 'invited':
      return `Invited collaborator(s) ${project}`;
    default:
      return `${item.action || item.type} ${project}`;
  }
}

async function fetchActivityFeed({ eventType, project, dateRange, jwt }: FetchActivityFeedParams): Promise<{ feed: ActivityFeedGroup[] }> {
  const params = new URLSearchParams();
  if (eventType) params.append('eventType', eventType);
  if (project && project !== 'All') params.append('project', project);
  if (dateRange) params.append('dateRange', dateRange);
  const res = await fetch(`/api/activity-feed?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch activity feed');
  return res.json();
}

export default function ActivityFeed() {
  const [eventType, setEventType] = useState<string>('All');
  const [project, setProject] = useState<string>('All');
  const [dateRange, setDateRange] = useState<string>('Yesterday');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [feed, setFeed] = useState<ActivityFeedGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [jwt, setJwt] = useState<string>('');
  const [projectOptions, setProjectOptions] = useState<string[]>(['All']);

  // Get JWT from Supabase client (client-side only)
  useEffect(() => {
    async function getJwt() {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
        const supabase = createClient(url, anonKey);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) setJwt(session.access_token);
      } catch (e) {
        setError('Could not get authentication token.');
      }
    }
    getJwt();
  }, []);

  // Fetch feed data
  useEffect(() => {
    if (!jwt) return;
    setLoading(true);
    setError('');
    fetchActivityFeed({ eventType, project, dateRange, jwt })
      .then(({ feed }) => {
        setFeed(feed);
        // Dynamically populate project options from feed (use project_name)
        const projects = new Set<string>(['All']);
        feed.forEach((group: ActivityFeedGroup) => {
          group.items.forEach((item: ActivityFeedItem) => {
            if (item.project_name && item.project_name !== '') projects.add(item.project_name);
          });
        });
        setProjectOptions(Array.from(projects));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventType, project, dateRange, jwt]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !jwt) return;
    const interval = setInterval(() => {
      fetchActivityFeed({ eventType, project, dateRange, jwt })
        .then(({ feed }) => setFeed(feed))
        .catch(() => {});
    }, 30000); // 30s
    return () => clearInterval(interval);
  }, [autoRefresh, eventType, project, dateRange, jwt]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 700,
      margin: '0 auto',
      padding: '32px 0',
    }}>
      <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 700, marginBottom: 24 }}>Activity Feed</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <label style={{ color: '#fff' }}>
          Event Type:
          <select value={eventType} onChange={e => setEventType(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, padding: '4px 8px' }}>
            {filterOptions.eventType.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </label>
        <label style={{ color: '#fff' }}>
          Project:
          <select value={project} onChange={e => setProject(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, padding: '4px 8px' }}>
            {projectOptions.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </label>
        <label style={{ color: '#fff' }}>
          Date Range:
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ marginLeft: 8, borderRadius: 6, padding: '4px 8px' }}>
            {filterOptions.dateRange.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </label>
        <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
          Auto-refresh
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} style={{ marginLeft: 4 }} />
        </label>
      </div>
      {loading && <div style={{ color: '#fff', marginBottom: 16 }}>Loading...</div>}
      {error && <div style={{ color: 'salmon', marginBottom: 16 }}>{error}</div>}
      {feed.map((group: ActivityFeedGroup) => (
        <div key={group.group} style={{ marginBottom: 32 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 18, marginBottom: 12 }}>{group.group}</div>
          <div style={{
            background: 'rgba(20, 24, 31, 0.85)',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            padding: 24,
          }}>
            {group.items.map((item: ActivityFeedItem, idx: number) => (
              <div key={item.id || idx} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: idx !== group.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{ fontSize: 24, marginRight: 20 }}>{getEventIcon(item.action)}</span>
                <span style={{ color: '#fff', fontSize: 16 }}>{getEventDescription(item)}</span>
                {item.details && typeof item.details === 'object' && Object.keys(item.details).length > 0 && (
                  <span style={{ color: '#b0bec5', fontSize: 14, marginLeft: 12 }}>
                    {Object.entries(item.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', color: '#b0bec5', fontSize: 15 }}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!loading && feed.length === 0 && <div style={{ color: '#fff', marginTop: 24 }}>No activity found.</div>}
    </div>
  );
} 