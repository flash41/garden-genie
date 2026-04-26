'use client';

import Link from 'next/link';
import type { NotesCategory } from '@/types/notes';
import { CATEGORY_LABELS } from '@/types/notes';

interface CategoryFilterProps {
  categories: NotesCategory[];
  active: NotesCategory | null;
}

export function CategoryFilter({ categories, active }: CategoryFilterProps) {
  if (categories.length < 2) return null;

  return (
    <nav aria-label="Filter by category" className="flex flex-wrap gap-2 mb-8">
      <Link
        href="/notes"
        className={`px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
          !active
            ? 'bg-[#0a3d2b] text-white'
            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat}
          href={`/notes/category/${cat}`}
          className={`px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
            active === cat
              ? 'bg-[#0a3d2b] text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          {CATEGORY_LABELS[cat]}
        </Link>
      ))}
    </nav>
  );
}
