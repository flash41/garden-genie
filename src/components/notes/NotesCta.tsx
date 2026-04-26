import Link from 'next/link';

export function NotesCta() {
  return (
    <aside
      aria-label="Design your garden with Dedrab"
      className="my-12 border border-[#b8962e] bg-[#0a3d2b] rounded-sm p-8 md:p-10 text-center"
    >
      <p className="font-serif italic text-[#F8F9F8] text-lg md:text-xl mb-2">
        &ldquo;Your garden has more potential than you think.&rdquo;
      </p>
      <p className="text-stone-300 text-sm mb-6 max-w-md mx-auto">
        A Dedrab design plan shows you exactly what&rsquo;s possible with the space you already have.
      </p>
      <Link
        href="/design"
        className="inline-flex items-center gap-2 bg-[#b8962e] hover:bg-[#a07a22] text-white font-semibold px-7 py-3 rounded-sm transition-colors"
      >
        Build your plan
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </aside>
  );
}
