export const BASE_URL = 'https://crealize.llc';
import { locales as LOCALES_ARRAY } from '@/lib/i18n/config';
export const LOCALES = LOCALES_ARRAY;
export type Locale = typeof LOCALES[number];

export function altLanguages(current: Locale) {
  const map: Record<string, string> = {};
  for (const l of LOCALES) map[l] = `/${l}/`;
  map['x-default'] = '/ja/';
  return { canonical: `/${current}/`, languages: map } as const;
}
