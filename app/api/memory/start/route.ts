import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/memory/start?pairs=4 — returns shuffled cards, age-filtered
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pairs = Math.min(Math.max(Number(searchParams.get('pairs')) || 4, 4), 10);

  // Check if user is minor (under 18) via DB
  let isMinor = false;
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { dateOfBirth: true } });
  if (dbUser?.dateOfBirth) {
    const dob = new Date(dbUser.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    isMinor = age < 18;
  }

  // Filter posts by audience for minors
  const whereFilter = isMinor ? { audience: 'everyone' } : {};

  // Fetch ALL matching posts (limit to 200 to avoid memory issues)
  const allPosts = await prisma.post.findMany({
    where: whereFilter,
    select: {
      id: true,
      title: true,
      originalImage: true,
      interpretedImage: true,
      author: { select: { username: true, image: true } },
    },
    orderBy: { id: 'asc' },
    take: 200,
  });

  // Deduplicate by originalImage so no two cards show the same original
  const seenImages = new Set<string>();
  const uniquePosts = allPosts.filter((p) => {
    if (seenImages.has(p.originalImage)) return false;
    seenImages.add(p.originalImage);
    return true;
  });

  if (uniquePosts.length < pairs) {
    return NextResponse.json({ error: `Solo hay ${uniquePosts.length} imágenes originales distintas. Se necesitan ${pairs}.` }, { status: 400 });
  }

  // Randomly pick `pairs` posts
  const shuffledPool = [...uniquePosts].sort(() => Math.random() - 0.5);
  const posts = shuffledPool.slice(0, pairs);
  
  // Build cards: each post produces 2 (original + interpretation)
  const cards = posts.flatMap((post) => [
    {
      id: `${post.id}-orig`,
      pairId: post.id,
      type: 'original' as const,
      imageUrl: post.originalImage,
      title: post.title,
      author: post.author,
    },
    {
      id: `${post.id}-interp`,
      pairId: post.id,
      type: 'interpretation' as const,
      imageUrl: post.interpretedImage,
      title: post.title,
      author: post.author,
    },
  ]);

  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return NextResponse.json({ cards, pairs, isMinor });
}
