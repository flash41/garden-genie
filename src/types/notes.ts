export type NotesCategory = 'design' | 'plants' | 'how-to' | 'materials' | 'climate' | 'wildlife';

export const CATEGORY_LABELS: Record<NotesCategory, string> = {
  design: 'Design',
  plants: 'Plants',
  'how-to': 'How-To',
  materials: 'Materials',
  climate: 'Climate',
  wildlife: 'Wildlife',
};

export interface NotesFrontmatter {
  title: string;
  description: string;
  /** ISO 8601 date string (YYYY-MM-DD). Internal and machine use only — never rendered visibly to users. */
  publishedAt: string;
  category: NotesCategory;
  coverImage: string;
  coverImageAlt: string;
  updatedAt?: string;
  tags?: string[];
  featured?: boolean;
  draft?: boolean;
  ogImage?: string;
  /** Override canonical URL — set when dual-publishing (e.g. future HubSpot migration). */
  canonicalUrl?: string;
  /** HubSpot post ID — populated post-migration to link this MDX file to its HubSpot record. */
  hubspotId?: number;
  /** Set to true to render FAQPage JSON-LD schema on this post. */
  hasFaq?: boolean;
}

export interface NotesPost extends NotesFrontmatter {
  slug: string;
  readingTime: string;
}
