'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useT } from '@/lib/i18n/context';
import Link from 'next/link';

interface Actor {
  username: string;
  image: string | null;
}

interface NotificationItem {
  id: string;
  type: string;
  detail: string;
  read: boolean;
  createdAt: string;
  postId: string | null;
  actor: Actor;
}

// Emojis para reacciones
const EMOJIS: Record<string, string> = {
  like: '\u{1F44D}',
  fun: '\u{1F602}',
  angry: '\u{1F621}',
  indifferent: '\u{1F610}',
  surprised: '\u{1F62E}',
  disgust: '\u{1F92E}',
};

// Genera texto legible para cada tipo de notificación
function notifText(n: NotificationItem): string {
  const name = '@' + n.actor.username;
  switch (n.type) {
    case 'reaction':
      return `${name} reacted with ${EMOJIS[n.detail] || n.detail}`;
    case 'share':
      return `${name} shared your post`;
    case 'remix':
      return `${name} remixed your post`;
    default:
      return `${name} interacted with your post`;
  }
}

export default function NotificationBell() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifs(data.notifs || []);
          setUnread(data.unread || 0);
        }
      } catch {}
    };
    fetchNotifs();
    intervalRef.current = setInterval(fetchNotifs, 15000); // polling cada 15s
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-lg"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-80 glass-panel rounded-2xl border border-dark-glass-border overflow-hidden shadow-xl max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-dark-glass-border">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
            </div>
            {notifs.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-dark-glass-border/50 transition-colors ${n.read ? 'opacity-60' : 'bg-brand-primary/5'}`}
                  onClick={() => handleMarkRead(n.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm flex-shrink-0">
                    {n.actor.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.actor.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-brand-primary font-bold">{n.actor.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{notifText(n)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
