import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryPosts, getCategoryParams, getNotesPosts } from '@/lib/notes';
import { NotesGrid } from '@/components/notes/NotesGrid';
import { CategoryFilter } from '@/components/notes/CategoryFilter';
import { CATEGORY_LABELS } from '@/types/notes';
import type { NotesCategory } from '@/types/notes';

interface PageProps {
  params: Promise<{ cat: string }>;
}

export async function generateStaticParams() {
  return getCategoryParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cat: catParam } = await params;
  const cat = catParam as NotesCategory;
  if (!CATEGORY_LABELS[cat]) return {};

  const label = CATEGORY_LABELS[cat];
  return {
    title: `${label} — Notes`,
    description: `Garden design and layout guidance on ${label.toLowerCase()} from Dedrab.`,
    alternates: {
      canonical: `https://dedrab.com/notes/category/${cat}`,
    },
    openGraph: {
      title: `${label} · Dedrab Notes`,
      description: `Garden design guidance on ${label.toLowerCase()}.`,
      url: `https://dedrab.com/notes/category/${cat}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { cat: catParam } = await params;
  const cat = catParam as NotesCategory;

  if (!CATEGORY_LABELS[cat]) notFound();

  const posts = getCategoryPosts(cat);
  const allPosts = getNotesPosts();
  const allCategories = [...new Set(allPosts.map((p) => p.category))] as NotesCategory[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${CATEGORY_LABELS[cat]} — Dedrab Notes`,
    url: `https://dedrab.com/notes/category/${cat}`,
    description: `Garden design and layout guidance on ${CATEGORY_LABELS[cat].toLowerCase()} from Dedrab.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#F8F9F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <header className="mb-10">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center gap-2 text-sm text-stone-500">
                <li>
                  <a href="/notes" className="hover:text-[#0a3d2b] transition-colors">
                    Notes
                  </a>
                </li>
                <li aria-hidden="true" className="text-stone-300">/</li>
                <li className="text-stone-700 font-medium" aria-current="page">
                  {CATEGORY_LABELS[cat]}
                </li>
              </ol>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#b8962e] mb-2">
              Category
            </p>
            <h1 className="font-serif font-extrabold text-[#0a3d2b] text-4xl md:text-5xl">
              {CATEGORY_LABELS[cat]}
            </h1>
          </header>

          <CategoryFilter categories={allCategories} active={cat} />

          <NotesGrid posts={posts} />
        </div>
      </div>
    </>
  );
}
