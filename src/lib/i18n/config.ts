export const defaultLocale = "ja";
export const locales = ["ja", "en", "zh-TW"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  'zh-TW': "繁體中文",
} as const;
