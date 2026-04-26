interface CalloutProps {
  type?: 'tip' | 'warning' | 'note';
  children: React.ReactNode;
}

const STYLES = {
  tip: {
    border: 'border-[#0a3d2b]',
    bg: 'bg-[#eef6f1]',
    label: 'Tip',
    labelColor: 'text-[#0a3d2b]',
  },
  warning: {
    border: 'border-[#b8962e]',
    bg: 'bg-[#fdf8ee]',
    label: 'Worth noting',
    labelColor: 'text-[#7a6118]',
  },
  note: {
    border: 'border-stone-400',
    bg: 'bg-stone-50',
    label: 'Note',
    labelColor: 'text-stone-600',
  },
};

export function Callout({ type = 'note', children }: CalloutProps) {
  const s = STYLES[type];
  return (
    <aside className={`border-l-4 ${s.border} ${s.bg} px-5 py-4 my-6 rounded-r-sm not-prose`}>
      <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${s.labelColor}`}>
        {s.label}
      </p>
      <div className="text-[#1A1A1A] text-sm leading-relaxed [&>p]:m-0 [&>p+p]:mt-2">
        {children}
      </div>
    </aside>
  );
}
