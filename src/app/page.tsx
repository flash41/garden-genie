import type { Metadata } from 'next';
import { getNotesPosts } from '@/lib/notes';
import { NoteCard } from '@/components/notes/NoteCard';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.dedrab.com',
  },
};

export default function Page() {
  const recentPosts = getNotesPosts().slice(0, 3);

  const notesTeaserSection = recentPosts.length > 0 ? (
    <section className="bg-[#F8F9F8] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#b8962e] mb-2">
              From the notes
            </p>
            <h2 className="font-serif font-extrabold text-[#0a3d2b] text-3xl md:text-4xl">
              Garden design thinking
            </h2>
          </div>
          <a
            href="/notes"
            className="hidden md:inline-flex items-center gap-2 text-[#0a3d2b] font-semibold text-sm hover:text-[#b8962e] transition-colors"
          >
            All notes
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {recentPosts.map((post) => (
            <NoteCard key={post.slug} post={post} />
          ))}
        </div>
        <div className="text-center md:hidden">
          <a
            href="/notes"
            className="inline-flex items-center gap-2 text-[#0a3d2b] font-semibold text-sm hover:text-[#b8962e] transition-colors"
          >
            View all notes
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  ) : null;

  return <LandingPageClient notesTeaserSection={notesTeaserSection} />;
}
