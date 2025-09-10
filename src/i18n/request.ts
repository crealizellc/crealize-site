import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from '@/lib/i18n/config';
import en from '@/locales/en.json';
import ja from '@/locales/ja.json';
import fr from '@/locales/fr.json';
import de from '@/locales/de.json';
import es from '@/locales/es.json';
import zhTW from '@/locales/zh-TW.json';

export default getRequestConfig(async ({ locale }) => {
  const candidate = locale ?? defaultLocale;
  const normalized = (locales as readonly string[]).includes(candidate)
    ? (candidate as typeof locales[number])
    : defaultLocale;

  const messagesMap = {
    en,
    ja,
    fr,
    de,
    es,
    'zh-TW': zhTW,
  } as const;

  return {
    locale: normalized,
    messages: messagesMap[normalized],
  };
});


