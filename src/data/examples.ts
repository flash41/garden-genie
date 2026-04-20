export interface Example {
  style: string;
  slug: string;
  description: string;
  before: string;
  after: string;
  samplePdfUrl?: string;
}

export const EXAMPLES: Example[] = [
  {
    style: 'English Cottage',
    slug: 'cottage',
    description: 'Soft, abundant planting with climbing roses, lavender and informal paths.',
    before: '/examples/cottage-before.jpg',
    after: '/examples/cottage-after.png',
  },
  {
    style: 'Mediterranean',
    slug: 'mediterranean',
    description: 'Sun-baked terracotta, lavender, olive trees and warm rendered walls.',
    before: '/examples/mediterranean-before.jpg',
    after: '/examples/mediterranean-after.png',
  },
  {
    style: 'Wildlife & Pollinator',
    slug: 'wildlife',
    description: 'Naturalistic drifts of wildflowers and grasses supporting local wildlife.',
    before: '/examples/wildlife-before.jpg',
    after: '/examples/wildlife-after.png',
  },
  {
    style: 'Modern Minimalist',
    slug: 'modern',
    description: 'Clean lines, architectural planting and a restrained material palette.',
    before: '/examples/modern-before.jpg',
    after: '/examples/modern-after.png',
    samplePdfUrl: 'https://gtsnbzfadmhjtubhzcov.supabase.co/storage/v1/object/public/pdfs/DED-202604-UF2R.pdf',
  },
  {
    style: 'Zen Garden',
    slug: 'zen',
    description: 'Calm, considered spaces with clipped shrubs, stone and flowing grasses.',
    before: '/examples/zen-before.jpg',
    after: '/examples/zen-after.png',
    samplePdfUrl: 'https://gtsnbzfadmhjtubhzcov.supabase.co/storage/v1/object/public/pdfs/DED-202604-EWWH.pdf',
  },
  {
    style: 'Kitchen & Herb',
    slug: 'kitchen',
    description: 'Productive raised beds, espalier fruit trees and terracotta herb pots.',
    before: '/examples/kitchen-before.jpg',
    after: '/examples/kitchen-after.png',
  },
  {
    style: 'City Garden',
    slug: 'city',
    description: 'Smart, low-maintenance design making the most of a compact urban space.',
    before: '/examples/city-garden-before.jpg',
    after: '/examples/city-garden-after.jpg',
  },
];
