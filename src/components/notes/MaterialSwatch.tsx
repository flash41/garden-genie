interface MaterialSwatchProps {
  color: string;
  name: string;
  finish?: string;
}

export function MaterialSwatch({ color, name, finish }: MaterialSwatchProps) {
  return (
    <span className="not-prose inline-flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-sm mr-2 mb-2 align-middle">
      <span
        className="w-5 h-5 rounded-sm flex-shrink-0 border border-black/10"
        style={{ backgroundColor: color }}
        aria-label={`${name} colour swatch`}
      />
      <span className="font-semibold text-[#1A1A1A] text-sm">{name}</span>
      {finish && <span className="text-stone-500 text-xs">{finish}</span>}
    </span>
  );
}
