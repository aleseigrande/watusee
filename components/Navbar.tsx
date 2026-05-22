import Link from 'next/link';
import { PlusCircle, Sparkles } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileMenu from '@/components/MobileMenu';
import UserDropdown from '@/components/UserDropdown';
import NotificationBell from '@/components/NotificationBell';
import T from '@/components/T';
import SearchInput from '@/components/SearchInput';

export default async function Navbar() {
  const session = await auth();

  let userData = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: { select: { posts: true } },
        posts: {
          select: { id: true, likes: true, sharesCount: true },
        },
      },
    });
    if (user) {
      let isAdult = true;
      if (user.dateOfBirth) {
        const today = new Date();
        const age = today.getFullYear() - user.dateOfBirth.getFullYear();
        const m = today.getMonth() - user.dateOfBirth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < user.dateOfBirth.getDate())) {
          isAdult = age - 1 >= 18;
        } else {
          isAdult = age >= 18;
        }
      } else {
        isAdult = false;
      }
      const postIds = user.posts.map((p) => p.id);
      const totalLikes = user.posts.reduce((sum, p) => sum + p.likes, 0);
      const totalShares = user.posts.reduce((sum, p) => sum + p.sharesCount, 0);
      const totalRemixes = await prisma.post.count({
        where: { remixOfId: { in: postIds } },
      });
      userData = {
        username: user.username,
        email: user.email,
        image: user.image,
        isAdult,
        stats: {
          posts: user._count.posts,
          totalLikes,
          totalShares,
          totalRemixes,
        },
      };
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-dark-glass-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="WatUSee" className="h-9 w-auto" />
          <span className="text-2xl font-bold tracking-tighter text-gradient">WatUSee</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SearchInput />
        </div>

        <div className="hidden md:flex items-center gap-1 mr-2">
          <Link href="/play" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-300 hover:text-brand-accent transition-colors rounded-lg hover-lift">
            <Sparkles className="h-4 w-4" />
            <span><T id="nav.games" /></span>
          </Link>
          <Link href="/imaginarium" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-300 hover:text-brand-accent transition-colors rounded-lg hover-lift">
            <Sparkles className="h-4 w-4" />
            <span><T id="nav.imaginarium" /></span>
          </Link>
          {userData?.isAdult && (
            <Link href="/adults" className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors rounded-lg hover-lift">
              <span><T id="nav.adults" /></span>
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {session?.user && <NotificationBell />}
          <LanguageSwitcher />
          
          <Link href="/create" className="hidden md:flex items-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-full font-medium transition-all hover-lift">
            <PlusCircle className="h-5 w-5" />
            <span><T id="nav.create" /></span>
          </Link>

          {session?.user ? (
            <UserDropdown sessionUser={session.user} initialData={userData} />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                <T id="nav.login" />
              </Link>
              <Link href="/register" className="bg-dark-surface border border-dark-glass-border hover:bg-brand-primary text-white px-4 py-2 rounded-full text-sm font-medium transition-all">
                <T id="nav.register" />
              </Link>
            </div>
          )}
        </div>

        <MobileMenu session={session} />
        
      </div>
    </header>
  );
}
