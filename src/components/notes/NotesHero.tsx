import Image from 'next/image';
import Link from 'next/link';
import type { NotesPost } from '@/types/notes';
import { CATEGORY_LABELS } from '@/types/notes';

interface NotesHeroProps {
  post: NotesPost;
}

export function NotesHero({ post }: NotesHeroProps) {
  return (
    <header className="mb-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <li>
            <Link href="/" className="hover:text-[#0a3d2b] transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-stone-300">/</li>
          <li>
            <Link href="/notes" className="hover:text-[#0a3d2b] transition-colors">
              Notes
            </Link>
          </li>
          <li aria-hidden="true" className="text-stone-300">/</li>
          <li>
            <Link
              href={`/notes/category/${post.category}`}
              className="hover:text-[#0a3d2b] transition-colors"
            >
              {CATEGORY_LABELS[post.category]}
            </Link>
          </li>
          <li aria-hidden="true" className="text-stone-300">/</li>
          <li
            className="text-stone-700 font-medium truncate max-w-[200px] md:max-w-xs"
            aria-current="page"
          >
            {post.title}
          </li>
        </ol>
      </nav>

      {/* Cover image */}
      {post.coverImage && (
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-sm mb-8 bg-stone-100">
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Article meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5">
        <Link
          href={`/notes/category/${post.category}`}
          className="text-xs font-semibold tracking-wider uppercase text-white bg-[#0a3d2b] px-2.5 py-1 rounded-sm hover:bg-[#064e3b] transition-colors"
        >
          {CATEGORY_LABELS[post.category]}
        </Link>
        <span className="text-sm text-stone-500 font-medium">Written by Dedrab</span>
        <span className="text-stone-300" aria-hidden="true">·</span>
        <span className="text-sm text-stone-500">{post.readingTime}</span>
        {/* Machine-readable publication date — not displayed to users */}
        <time dateTime={post.publishedAt} className="sr-only">
          Published{' '}
          {new Date(post.publishedAt).toLocaleDateString('en-IE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </div>

      {/* Title */}
      <h1 className="font-serif font-extrabold text-[#0a3d2b] text-3xl md:text-4xl lg:text-5xl leading-tight">
        {post.title}
      </h1>
    </header>
  );
}
