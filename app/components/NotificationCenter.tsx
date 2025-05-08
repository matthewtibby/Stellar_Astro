import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseClient, useSession } from '../SupabaseProvider';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
  default: '🔔',
};

function getTypeIcon(type: string) {
  return typeIcons[type?.toLowerCase()] || typeIcons.default;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jwt, setJwt] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = useSupabaseClient();
  const session = useSession();

  useEffect(() => {
    if (session?.access_token) setJwt(session.access_token);
  }, [session]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!jwt) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const { notifications } = await res.json();
      setNotifications(notifications);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, jwt]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!jwt) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          fontSize: 24,
          color: '#fff',
        }}
        title="Notifications"
      >
        <span role="img" aria-label="bell">🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#2D6DF6',
            color: '#fff',
            borderRadius: '50%',
            fontSize: 12,
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 36,
          width: 340,
          background: 'rgba(20, 24, 31, 0.98)',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          zIndex: 1000,
          padding: 0,
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #222', color: '#fff', fontWeight: 600, fontSize: 18 }}>
            Notifications
          </div>
          {loading && <div style={{ color: '#fff', padding: 16 }}>Loading...</div>}
          {error && <div style={{ color: 'salmon', padding: 16 }}>{error}</div>}
          {!loading && notifications.length === 0 && <div style={{ color: '#fff', padding: 16 }}>No notifications.</div>}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.map((n) => (
              <div key={n.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: n.read ? 'transparent' : 'rgba(45,109,246,0.08)',
              }}>
                <span style={{ fontSize: 22, marginRight: 16 }}>{getTypeIcon(n.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: n.read ? '#b0bec5' : '#fff', fontSize: 15 }}>{n.message}</div>
                  <div style={{ color: '#b0bec5', fontSize: 13 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    style={{
                      marginLeft: 12,
                      background: '#2D6DF6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 