import { Metadata } from 'next';
import { getNotesPosts, getFeaturedPost } from '@/lib/notes';
import { NotesFeatured } from '@/components/notes/NotesFeatured';
import { NotesGrid } from '@/components/notes/NotesGrid';
import { CategoryFilter } from '@/components/notes/CategoryFilter';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import type { NotesCategory } from '@/types/notes';

export const metadata: Metadata = {
  title: 'Notes',
  description:
    'Garden design and layout guidance from Dedrab — planting, materials, spatial planning, and seasonal advice for Irish and UK gardens.',
  alternates: {
    canonical: 'https://www.dedrab.com/notes',
    types: {
      'application/rss+xml': [
        { url: 'https://www.dedrab.com/notes/feed.xml', title: 'Dedrab Notes RSS Feed' },
      ],
    },
  },
  openGraph: {
    title: 'Notes — Dedrab Garden Design',
    description:
      'Garden design and layout guidance. Planting, materials, spatial planning, and seasonal advice.',
    url: 'https://www.dedrab.com/notes',
    type: 'website',
  },
};

export default function NotesPage() {
  const allPosts = getNotesPosts();
  const featured = getFeaturedPost();
  const remainingPosts = featured
    ? allPosts.filter((p) => p.slug !== featured.slug)
    : allPosts;

  const categories = [...new Set(allPosts.map((p) => p.category))] as NotesCategory[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Dedrab Notes',
    url: 'https://www.dedrab.com/notes',
    description: 'Garden design and layout guidance from Dedrab.',
    publisher: {
      '@type': 'Organization',
      name: 'Dedrab',
      url: 'https://www.dedrab.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader variant="solid" />
      <div className="min-h-screen bg-[#F8F9F8] pt-20 md:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <header className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#b8962e] mb-3">
              Dedrab
            </p>
            <h1 className="font-serif font-extrabold text-[#0a3d2b] text-4xl md:text-5xl mb-4">
              Notes
            </h1>
            <p className="text-stone-600 text-lg max-w-2xl leading-relaxed">
              Garden design and layout guidance — planting, materials, spatial planning, and
              seasonal advice.
            </p>
          </header>

          <CategoryFilter categories={categories} active={null} />

          {featured && <NotesFeatured post={featured} />}

          {remainingPosts.length > 0 && (
            <section aria-label="More notes">
              {featured && (
                <h2 className="font-serif font-bold text-[#1A1A1A] text-2xl mb-6">
                  More notes
                </h2>
              )}
              <NotesGrid posts={remainingPosts} />
            </section>
          )}

          {allPosts.length === 0 && (
            <div className="text-center py-24">
              <p className="font-serif text-[#0a3d2b] text-2xl mb-2">First note coming soon.</p>
              <p className="text-stone-500">Check back shortly.</p>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
