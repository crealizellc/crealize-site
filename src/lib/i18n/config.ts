export const defaultLocale = "ja";
// 仅包含已有消息文件的语言
export const locales = ["ja", "en", "fr", "de", "es", "zh-TW"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  'zh-TW': "繁體中文",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
} as const;

// 从Google Sheets获取翻译数据的配置
export const TRANSLATION_SHEET_CONFIG = {
  sheetId: process.env.NEXT_PUBLIC_TRANSLATION_SHEET_ID,
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY,
  range: "Translations!A:Z",
};
