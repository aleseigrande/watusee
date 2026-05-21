import Link from 'next/link';
import Hero from "@/components/Hero";
import PostCard from "@/components/PostCard";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import T from '@/components/T';

export const dynamic = 'force-dynamic';

// Calcula si un usuario es menor de 18 años según su fecha de nacimiento.
// Si no tiene fecha registrada, lo trata como menor (seguridad).
function isMinor(dateOfBirth: Date | null): boolean {
  if (!dateOfBirth) return true;
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    return age - 1 < 18;
  }
  return age < 18;
}

// Ordena posts por puntuación combinada: likes + comentarios + shares + remixes.
// Usado por el filtro "Top".
function sortByScore(posts: any[]) {
  return [...posts].sort((a, b) => {
    const scoreA = a.likes + a.commentsCount + a.sharesCount + a._count.remixes;
    const scoreB = b.likes + b.commentsCount + b.sharesCount + b._count.remixes;
    return scoreB - scoreA;
  });
}

// Página principal: muestra el feed de posts con filtros Latest / Top / Adults.
// - v=feed (default): posts generales (no adultos)
// - v=adults: solo contenido adulto (requiere 18+)
// - sort=latest|top: orden dentro de cada vista
export default async function Home(props: { searchParams?: Promise<{ v?: string; sort?: string }> }) {
  const searchParams = await props.searchParams;
  const view = searchParams?.v || 'feed';
  const sort = searchParams?.sort || 'latest';
  const session = await auth();

  // Determina si el usuario logueado es menor de edad
  let userIsMinor = true;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dateOfBirth: true },
    });
    userIsMinor = isMinor(user?.dateOfBirth ?? null);
  }
  const userIsAdult = !!session?.user && !userIsMinor;

  const isAdultsView = view === 'adults' && userIsAdult;

  // Filtro base: solo posts originales (no remixes)
  const whereFilter: any = { remixOfId: null };
  // Si es menor o no está logueado, oculta contenido adulto
  if (userIsMinor || !session?.user) {
    whereFilter.audience = { not: 'adults' };
  }
  // Si está en vista adultos, muestra solo adultos
  if (isAdultsView) {
    whereFilter.audience = 'adults';
  }

  const posts = await prisma.post.findMany({
    where: whereFilter,
    include: {
      author: true,
      _count: {
        select: { remixes: true },
      },
      reactions: {
        select: { type: true, userId: true },
      },
    },
    orderBy: sort === 'top' ? undefined : { createdAt: 'desc' as const },
  });

  // Procesa reacciones: agrupa por tipo y detecta la reacción del usuario actual
  const userId = session?.user?.id;
  const postsWithReactions = posts.map((post) => {
    const reactionCounts: Record<string, number> = {};
    let userReaction: string | null = null;
    for (const r of post.reactions) {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      if (r.userId === userId) userReaction = r.type;
    }
    const { reactions, ...rest } = post;
    return { ...rest, reactionCounts, userReaction };
  });

  const sortedPosts = sort === 'top' ? sortByScore(postsWithReactions) : postsWithReactions;

  // Clases CSS para botones de filtro (activo vs inactivo)
  const btnClass = (active: boolean) =>
    active
      ? 'px-4 py-2 rounded-full bg-brand-primary text-white text-sm font-medium transition-colors'
      : 'px-4 py-2 rounded-full bg-dark-surface border border-dark-glass-border text-sm font-medium hover:text-brand-accent transition-colors';

  const activeFilter = isAdultsView ? `adults_${sort}` : `${view}_${sort}`;

  return (
    <>
      <Hero />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* === FILA DE FILTROS GENERALES (Latest / Top) === */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight"><T id="home.trending" /></h2>
          <div className="flex gap-2">
            <Link href="/" className={btnClass(activeFilter === 'feed_latest')} scroll={false}><T id="home.latest" /></Link>
            <Link href="/?v=feed&sort=top" className={btnClass(activeFilter === 'feed_top')} scroll={false}><T id="home.top" /></Link>
          </div>
        </div>

        {/* === GRILLA PRINCIPAL (solo se muestra si NO estás en vista Adults) === */}
        {!isAdultsView && (
          sortedPosts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <T id="home.empty" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {sortedPosts.map((post) => (
                <PostCard 
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  author={post.author.username}
                  originalImage={post.originalImage}
                  interpretedImage={post.interpretedImage}
                  likes={post.likes}
                  comments={post.commentsCount}
                  remixesCount={post._count.remixes}
                  audience={post.audience}
                  reactionCounts={post.reactionCounts}
                  userReaction={post.userReaction}
                />
              ))}
            </div>
          )
        )}

        {/* === SECCIÓN ADULTS — solo visible para usuarios 18+ === */}
        {userIsAdult && (
          <div className="mt-16">
            {/* Fila de filtros para contenido adulto */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-red-400">Adults</h2>
              <div className="flex gap-2">
                <Link href="/?v=adults&sort=latest" className={btnClass(activeFilter === 'adults_latest')} scroll={false}><T id="home.latest" /></Link>
                <Link href="/?v=adults&sort=top" className={btnClass(activeFilter === 'adults_top')} scroll={false}><T id="home.top" /></Link>
              </div>
            </div>

            {/* Grilla de adultos (se ve solo cuando está activa la vista Adults) */}
            {isAdultsView && (
              sortedPosts.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  No hay contenido adulto aún.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {sortedPosts.map((post) => (
                    <PostCard 
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      author={post.author.username}
                      originalImage={post.originalImage}
                      interpretedImage={post.interpretedImage}
                      likes={post.likes}
                      comments={post.commentsCount}
                      remixesCount={post._count.remixes}
                      audience={post.audience}
                      reactionCounts={post.reactionCounts}
                      userReaction={post.userReaction}
                    />
                  ))}
                </div>
              )
            )}

            {/* Mensaje informativo cuando no se ha seleccionado la vista Adults */}
            {!isAdultsView && (
              <div className="text-center py-16 border-2 border-dashed border-red-500/30 rounded-2xl">
                <p className="text-gray-400 text-lg mb-4">
                  Haz clic en <span className="text-red-400 font-bold">Latest</span> o <span className="text-red-400 font-bold">Top</span> para explorar contenido adulto.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
