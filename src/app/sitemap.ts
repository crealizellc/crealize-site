import type { MetadataRoute } from 'next';
import { BASE_URL, LOCALES } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = LOCALES.map((l) => ({ url: `${BASE_URL}/${l}/`, lastModified: new Date() }));
  items.push({ url: `${BASE_URL}/`, lastModified: new Date() });
  return items;
}
