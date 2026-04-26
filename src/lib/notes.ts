import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { NotesPost, NotesFrontmatter, NotesCategory } from '@/types/notes';

const NOTES_DIR = path.join(process.cwd(), 'src/content/notes');

function getNotesFiles(): string[] {
  if (!fs.existsSync(NOTES_DIR)) return [];
  const entries = fs.readdirSync(NOTES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
    .map((entry) => entry.name);
}

export function parseNotesPost(filename: string): NotesPost {
  const slug = filename.replace(/\.mdx$/, '');
  const filePath = path.join(NOTES_DIR, filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const fm = data as NotesFrontmatter;

  if (fm.coverImage && !fm.coverImageAlt) {
    throw new Error(
      `[Notes] Post "${slug}" has coverImage but is missing required coverImageAlt. Add it to the frontmatter.`
    );
  }

  const stats = readingTime(content);

  return {
    ...fm,
    slug,
    readingTime: `${Math.ceil(stats.minutes)} min read`,
  };
}

export function getNotesPosts(): NotesPost[] {
  const files = getNotesFiles();
  const posts = files.map(parseNotesPost);

  return posts
    .filter((post) => !post.draft)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function getNotesPost(
  slug: string
): { post: NotesPost; content: string } | null {
  const filePath = path.join(NOTES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const fm = data as NotesFrontmatter;

  if (fm.draft) return null;

  const stats = readingTime(content);

  const post: NotesPost = {
    ...fm,
    slug,
    readingTime: `${Math.ceil(stats.minutes)} min read`,
  };

  return { post, content };
}

export function getCategoryPosts(category: NotesCategory): NotesPost[] {
  return getNotesPosts().filter((post) => post.category === category);
}

export function getFeaturedPost(): NotesPost | null {
  const posts = getNotesPosts();
  return posts.find((p) => p.featured) ?? posts[0] ?? null;
}

export function getNotesSlugParams(): { slug: string }[] {
  return getNotesPosts().map((post) => ({ slug: post.slug }));
}

export function getCategoryParams(): { cat: NotesCategory }[] {
  const posts = getNotesPosts();
  const categories = [...new Set(posts.map((p) => p.category))];
  return categories.map((cat) => ({ cat }));
}

export function extractHeadings(
  content: string
): { id: string; text: string; level: 2 | 3 }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    headings.push({ id, text, level });
  }

  return headings;
}
