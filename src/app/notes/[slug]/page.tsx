import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getNotesPost, getNotesSlugParams, extractHeadings } from '@/lib/notes';
import { NotesHero } from '@/components/notes/NotesHero';
import { TableOfContents } from '@/components/notes/TableOfContents';
import { NotesCta } from '@/components/notes/NotesCta';
import { Callout } from '@/components/notes/Callout';
import { PlantCard } from '@/components/notes/PlantCard';
import { PullQuote } from '@/components/notes/PullQuote';
import { StepList, Step } from '@/components/notes/StepList';
import { ImageComparison } from '@/components/notes/ImageComparison';
import { MaterialSwatch } from '@/components/notes/MaterialSwatch';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const mdxComponents = {
  Callout,
  PlantCard,
  PullQuote,
  StepList,
  Step,
  ImageComparison,
  MaterialSwatch,
};

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};

export async function generateStaticParams() {
  return getNotesSlugParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = getNotesPost(slug);
  if (!result) return {};

  const { post } = result;
  const canonical = post.canonicalUrl ?? `https://dedrab.com/notes/${post.slug}`;
  const ogImage = post.ogImage ?? post.coverImage;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${post.title} · Dedrab Notes`,
      description: post.description,
      url: canonical,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: ['Dedrab'],
      ...(ogImage && {
        images: [
          {
            url: ogImage.startsWith('http') ? ogImage : `https://dedrab.com${ogImage}`,
            alt: post.coverImageAlt,
          },
        ],
      }),
    },
  };
}

export default async function NotesPostPage({ params }: PageProps) {
  const { slug } = await params;
  const result = getNotesPost(slug);
  if (!result) notFound();

  const { post, content } = result;
  const headings = extractHeadings(content);
  const hasToC = headings.length >= 3;
  const canonical = post.canonicalUrl ?? `https://dedrab.com/notes/${slug}`;
  const ogImage = post.ogImage ?? post.coverImage;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    url: canonical,
    author: {
      '@type': 'Organization',
      name: 'Dedrab',
      url: 'https://dedrab.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Dedrab',
      url: 'https://dedrab.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dedrab.com/logo.png',
      },
    },
    ...(ogImage && {
      image: {
        '@type': 'ImageObject',
        url: ogImage.startsWith('http') ? ogImage : `https://dedrab.com${ogImage}`,
      },
    }),
    ...(post.tags && { keywords: post.tags.join(', ') }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dedrab.com' },
      { '@type': 'ListItem', position: 2, name: 'Notes', item: 'https://dedrab.com/notes' },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.category,
        item: `https://dedrab.com/notes/category/${post.category}`,
      },
      { '@type': 'ListItem', position: 4, name: post.title, item: canonical },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="min-h-screen bg-[#F8F9F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className={hasToC ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-12 lg:items-start' : ''}>
            {/* Main article */}
            <article className="min-w-0">
              <NotesHero post={post} />

              <div
                className="
                  prose prose-stone max-w-none
                  prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#0a3d2b] prose-headings:tracking-tight
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:scroll-mt-24
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:scroll-mt-24
                  prose-p:text-[#1A1A1A] prose-p:leading-relaxed
                  prose-a:text-[#0a3d2b] prose-a:font-medium prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[#b8962e]
                  prose-strong:text-[#1A1A1A] prose-strong:font-semibold
                  prose-blockquote:border-l-[#b8962e] prose-blockquote:not-italic prose-blockquote:text-[#1A1A1A]
                  prose-li:text-[#1A1A1A]
                  prose-img:rounded-sm
                  prose-hr:border-stone-200
                  prose-code:text-[#0a3d2b] prose-code:bg-stone-100 prose-code:px-1 prose-code:rounded-sm prose-code:before:content-none prose-code:after:content-none
                "
              >
                <MDXRemote
                  source={content}
                  components={mdxComponents}
                  options={mdxOptions}
                />
              </div>

              <NotesCta />

              <footer className="mt-8 pt-6 border-t border-stone-200">
                <p className="text-sm text-stone-500">Written by Dedrab</p>
              </footer>
            </article>

            {/* Table of contents */}
            {hasToC && (
              <aside className="hidden lg:block">
                <TableOfContents headings={headings} />
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
