export const BASE_URL = 'https://your-domain.com';
import { locales as LOCALES_ARRAY } from '@/lib/i18n/config';
export const LOCALES = LOCALES_ARRAY;
export type Locale = typeof LOCALES[number];

export function altLanguages(current: Locale) {
  const map: Record<string, string> = {};
  for (const l of LOCALES) map[l] = `/${l}/`;
  map['x-default'] = '/';
  return { canonical: `/${current}/`, languages: map } as const;
}

export function og(locale: Locale) {
  return {
    title: 'Crealize — Transforming Imagination into Reality',
    description: 'Web3 × Gamification × AI.',
    url: `${BASE_URL}/${locale}/`,
    siteName: 'Crealize',
    images: [{ url: `/og/og-${locale}.jpg`, width: 1200, height: 630, alt: 'Crealize' }],
    locale: locale === 'en' ? 'en_US' : (locale as string),
    type: 'website',
  } as const;
}


