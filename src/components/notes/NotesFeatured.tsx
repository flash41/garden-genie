import Image from 'next/image';
import Link from 'next/link';
import type { NotesPost } from '@/types/notes';
import { CATEGORY_LABELS } from '@/types/notes';

interface NotesFeaturedProps {
  post: NotesPost;
}

export function NotesFeatured({ post }: NotesFeaturedProps) {
  return (
    <article className="group bg-white border border-stone-200 rounded-sm overflow-hidden mb-10">
      <Link href={`/notes/${post.slug}`} className="block">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[360px] overflow-hidden bg-stone-100">
            {post.coverImage && (
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            )}
          </div>
          <div className="flex flex-col justify-center p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-white bg-[#0a3d2b] px-2.5 py-1 rounded-sm">
                {CATEGORY_LABELS[post.category]}
              </span>
              <span className="text-xs text-stone-500 font-medium">{post.readingTime}</span>
            </div>
            <h2 className="font-serif font-extrabold text-[#0a3d2b] text-2xl md:text-3xl leading-tight mb-4 group-hover:text-[#064e3b] transition-colors">
              {post.title}
            </h2>
            <p className="text-stone-600 leading-relaxed mb-6 line-clamp-3">
              {post.description}
            </p>
            <span className="inline-flex items-center text-[#0a3d2b] font-semibold text-sm group-hover:text-[#b8962e] transition-colors">
              Read the note
              <svg
                className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
