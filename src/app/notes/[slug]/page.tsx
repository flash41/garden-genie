import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getNotesPost, getNotesSlugParams, extractHeadings, extractFaq, slugifyHeading } from '@/lib/notes';
import { NotesHero } from '@/components/notes/NotesHero';
import { TableOfContents } from '@/components/notes/TableOfContents';
import { NotesCta } from '@/components/notes/NotesCta';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { Callout } from '@/components/notes/Callout';
import { PlantCard } from '@/components/notes/PlantCard';
import { PullQuote } from '@/components/notes/PullQuote';
import { StepList, Step } from '@/components/notes/StepList';
import { ImageComparison } from '@/components/notes/ImageComparison';
import { MaterialSwatch } from '@/components/notes/MaterialSwatch';

function childrenToText(children: unknown): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return (children as unknown[]).map(childrenToText).join('');
  if (children !== null && typeof children === 'object') {
    const el = children as { props?: { children?: unknown } };
    if (el.props?.children !== undefined) return childrenToText(el.props.children);
  }
  return '';
}

// ISR: revalidate every hour so future-dated articles begin serving 200 within
// ~1 hour of their publishedAt arriving, without requiring a fresh deploy.
// See getNotesSlugParams() in src/lib/notes.ts for the full mechanism.
export const revalidate = 3600;

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
  h2: ({ children, ...props }: { children?: unknown; [key: string]: unknown }) => (
    <h2 id={slugifyHeading(childrenToText(children))} {...(props as object)}>
      {children as React.ReactNode}
    </h2>
  ),
  h3: ({ children, ...props }: { children?: unknown; [key: string]: unknown }) => (
    <h3 id={slugifyHeading(childrenToText(children))} {...(props as object)}>
      {children as React.ReactNode}
    </h3>
  ),
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
  const canonical = post.canonicalUrl ?? `https://www.dedrab.com/notes/${post.slug}`;
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
            url: ogImage.startsWith('http') ? ogImage : `https://www.dedrab.com${ogImage}`,
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
  const h2Headings = headings.filter((h) => h.level === 2);
  const hasToC = h2Headings.length >= 3;
  const canonical = post.canonicalUrl ?? `https://www.dedrab.com/notes/${slug}`;
  const ogImage = post.ogImage ?? post.coverImage;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Dedrab',
      url: 'https://www.dedrab.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Dedrab',
      url: 'https://www.dedrab.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.dedrab.com/dd_logo.png',
      },
    },
    ...(ogImage && {
      image: ogImage.startsWith('http') ? ogImage : `https://www.dedrab.com${ogImage}`,
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    articleSection: post.category,
    ...(post.tags && { keywords: post.tags.join(', ') }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.dedrab.com' },
      { '@type': 'ListItem', position: 2, name: 'Notes', item: 'https://www.dedrab.com/notes' },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.category,
        item: `https://www.dedrab.com/notes/category/${post.category}`,
      },
      { '@type': 'ListItem', position: 4, name: post.title, item: canonical },
    ],
  };

  // FAQPage JSON-LD — emitted when the article's frontmatter sets hasFaq: true
  // AND extractFaq() finds a recognisable FAQ section in the MDX body. Lets
  // Google render rich FAQ snippets in SERPs and improves the chance of being
  // cited by AI Overview when synthesising answers.
  const faqJsonLd = post.hasFaq
    ? (() => {
        const faqs = extractFaq(content);
        if (faqs.length === 0) return null;
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: answer,
            },
          })),
        };
      })()
    : null;

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
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <SiteHeader variant="solid" />
      <div className="min-h-screen bg-[#F8F9F8] pt-20 md:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className={hasToC ? 'lg:grid lg:grid-cols-[1fr_220px] lg:gap-12 lg:items-start' : ''}>
            {/* Main article */}
            <article className="min-w-0">
              <NotesHero post={post} />

              {hasToC && (
                <details className="lg:hidden mb-8 border border-stone-200 rounded-sm">
                  <summary className="cursor-pointer px-4 py-3 text-xs font-semibold tracking-widest uppercase text-stone-400 select-none list-none">
                    On this page
                  </summary>
                  <ul className="px-4 pb-3 pt-1 space-y-1 border-t border-stone-200">
                    {h2Headings.map(({ id, text }) => (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          className="block text-sm leading-snug py-1 text-stone-500 hover:text-[#0a3d2b] transition-colors"
                        >
                          {text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

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
                <TableOfContents headings={h2Headings} />
              </aside>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
