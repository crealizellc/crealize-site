import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from '@/lib/i18n/config';
import en from '@/locales/en.json';
import ja from '@/locales/ja.json';
import zhTW from '@/locales/zh-TW.json';

export default getRequestConfig(async ({ locale }) => {
  const candidate = locale ?? defaultLocale;
  const normalized = (locales as readonly string[]).includes(candidate)
    ? (candidate as typeof locales[number])
    : defaultLocale;

  const messagesMap = {
    en,
    ja,
    'zh-TW': zhTW,
  } as const;

  return {
    locale: normalized,
    messages: messagesMap[normalized],
  };
});
