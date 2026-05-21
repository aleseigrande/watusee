'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/context';
import { Send } from 'lucide-react';

interface CommentUser {
  username: string;
  image: string | null;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

export default function CommentsSection({ postId, initialCount }: { postId: string; initialCount: number }) {
  const t = useT();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {});
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setCount((prev) => prev + 1);
        setText('');
      }
    } catch {}
    setLoading(false);
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
    <div className="mt-12">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        Comments
        <span className="bg-brand-primary/20 text-brand-primary text-sm py-1 px-3 rounded-full">{count}</span>
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-zinc-800 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-brand-primary hover:bg-brand-secondary disabled:opacity-40 text-white p-3 rounded-xl transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 bg-zinc-800/50 rounded-xl p-3 border border-dark-glass-border/50">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm flex-shrink-0">
                {c.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-brand-primary font-bold">{c.user.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-white">@{c.user.username}</span>
                  <span className="text-xs text-gray-500">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-300 break-words">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
