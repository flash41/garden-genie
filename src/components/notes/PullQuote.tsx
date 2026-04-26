interface PullQuoteProps {
  children: React.ReactNode;
}

export function PullQuote({ children }: PullQuoteProps) {
  return (
    <blockquote className="not-prose border-l-4 border-[#b8962e] pl-6 my-8">
      <p className="font-serif italic text-[#0a3d2b] text-xl md:text-2xl leading-relaxed">
        {children}
      </p>
    </blockquote>
  );
}
