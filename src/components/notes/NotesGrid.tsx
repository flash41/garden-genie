import type { NotesPost } from '@/types/notes';
import { NoteCard } from './NoteCard';

interface NotesGridProps {
  posts: NotesPost[];
}

export function NotesGrid({ posts }: NotesGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-xl text-stone-500">No posts in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <NoteCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
