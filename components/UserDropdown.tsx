'use client';

import { useState, useRef } from 'react';
import { LogOut, Camera, Loader2, Image } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/context';

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UserStats {
  posts: number;
  totalLikes: number;
  totalShares: number;
  totalRemixes: number;
}

interface UserData {
  username: string;
  email: string | null;
  image: string | null;
  isAdult: boolean;
  stats: UserStats;
}

export default function UserDropdown({ sessionUser, initialData }: { sessionUser?: SessionUser; initialData?: UserData | null }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(initialData || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const res = await fetch('/api/user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          setUser((prev) => prev ? { ...prev, image: data.image } : null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const displayName = user?.username || sessionUser?.name || '?';
  const displayEmail = user?.email || sessionUser?.email || null;
  const displayImage = user?.image || sessionUser?.image || null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-full border border-dark-glass-border overflow-hidden hover:border-brand-primary transition-colors"
      >
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 bg-brand-secondary flex items-center justify-center text-white font-bold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-72 max-[400px]:w-[260px] glass-panel rounded-2xl border border-dark-glass-border overflow-hidden shadow-xl">
            {user ? (
              <>
                {/* Avatar section */}
                <div className="flex flex-col items-center pt-6 pb-4 px-6 bg-gradient-to-b from-brand-primary/10 to-transparent">
                  <div className="relative group mb-3">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.image}
                        alt={user.username}
                        className="h-16 w-16 rounded-full object-cover border-2 border-brand-primary/30"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-brand-secondary flex items-center justify-center text-white font-bold text-2xl border-2 border-brand-primary/30">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-brand-primary rounded-full text-white hover:bg-brand-primary/80 transition-colors shadow-lg"
                    >
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <p className="text-white font-bold text-lg">{user.username}</p>
                  {user.email && (
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 px-6 py-4 border-t border-dark-glass-border">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{user.stats.posts}</p>
                    <p className="text-xs text-gray-400">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{user.stats.totalLikes}</p>
                    <p className="text-xs text-gray-400">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{user.stats.totalShares}</p>
                    <p className="text-xs text-gray-400">Shares</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{user.stats.totalRemixes}</p>
                    <p className="text-xs text-gray-400">Remixes</p>
                  </div>
                </div>

                {/* My Creations */}
                <div className="border-t border-dark-glass-border">
                  <Link
                    href="/my-creations"
                    className="w-full flex items-center gap-3 px-6 py-3 text-gray-400 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors text-sm"
                    onClick={() => setOpen(false)}
                  >
                    <Image className="w-4 h-4" />
                    {t('nav.mycreations')}
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-dark-glass-border">
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-6 py-3 text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center">
                <p className="text-white font-bold text-lg">{displayName}</p>
                {displayEmail && <p className="text-gray-400 text-sm mb-4">{displayEmail}</p>}
                <p className="text-gray-500 text-xs">Error al cargar estadísticas</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
