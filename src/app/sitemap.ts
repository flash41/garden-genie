import { MetadataRoute } from 'next';
import { getNotesPosts, getCategoryParams } from '@/lib/notes';

const BASE_URL = 'https://www.dedrab.com';

export default function sitemap(): MetadataRoute.Sitemap {
  let posts: ReturnType<typeof getNotesPosts> = [];
  let categories: ReturnType<typeof getCategoryParams> = [];

  try {
    posts = getNotesPosts();
    categories = getCategoryParams();
  } catch {
    // No posts yet — return static pages only
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/notes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: post.canonicalUrl ?? `${BASE_URL}/notes/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map(({ cat }) => ({
    url: `${BASE_URL}/notes/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...postPages, ...categoryPages];
}
