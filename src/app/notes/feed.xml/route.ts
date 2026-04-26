import { getNotesPosts } from '@/lib/notes';

const BASE_URL = 'https://dedrab.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let posts: ReturnType<typeof getNotesPosts> = [];

  try {
    posts = getNotesPosts();
  } catch {
    // No posts yet
  }

  const items = posts
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/notes/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/notes/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
    </item>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Dedrab — Garden Design Notes</title>
    <link>${BASE_URL}/notes</link>
    <description>Garden design and layout guidance from Dedrab.</description>
    <language>en-IE</language>
    <copyright>Dedrab</copyright>
    <atom:link href="${BASE_URL}/notes/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
