import Image from 'next/image';

interface PlantCardProps {
  name: string;
  botanical: string;
  hardiness: string;
  image?: string;
  description?: string;
}

export function PlantCard({ name, botanical, hardiness, image, description }: PlantCardProps) {
  return (
    <div className="not-prose flex gap-4 border border-stone-200 bg-white p-4 rounded-sm my-4">
      {image && (
        <div className="relative w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden bg-stone-100">
          <Image
            src={image}
            alt={`${name} (${botanical})`}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-serif font-bold text-[#0a3d2b] text-base leading-snug">{name}</p>
        <p className="text-stone-500 italic text-sm mt-0.5">{botanical}</p>
        <span className="inline-block mt-1.5 text-xs font-semibold text-white bg-[#0a3d2b] px-2 py-0.5 rounded-sm">
          {hardiness}
        </span>
        {description && (
          <p className="text-stone-600 text-sm mt-2 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}
