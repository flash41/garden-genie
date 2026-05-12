import Image from 'next/image';
import Link from 'next/link';
import type { NotesPost } from '@/types/notes';
import { CATEGORY_LABELS } from '@/types/notes';

interface NoteCardProps {
  post: NotesPost;
}

export function NoteCard({ post }: NoteCardProps) {
  return (
    <article className="group flex flex-col bg-white border border-stone-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <Link href={`/notes/${post.slug}`} aria-label={post.title} className="block relative aspect-[3/2] overflow-hidden bg-stone-100">
        {post.coverImage && (
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
      </Link>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/notes/category/${post.category}`}
            className="text-xs font-semibold tracking-wider uppercase text-white bg-[#0a3d2b] px-2.5 py-1 rounded-sm hover:bg-[#064e3b] transition-colors"
          >
            {CATEGORY_LABELS[post.category]}
          </Link>
          <span className="text-xs text-stone-500 font-medium">{post.readingTime}</span>
        </div>
        <Link href={`/notes/${post.slug}`} className="flex-1 group/title">
          <h2 className="font-serif font-bold text-[#1A1A1A] text-lg leading-snug mb-2 group-hover:text-[#0a3d2b] transition-colors line-clamp-3">
            {post.title}
          </h2>
          <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">
            {post.description}
          </p>
        </Link>
      </div>
    </article>
  );
}
