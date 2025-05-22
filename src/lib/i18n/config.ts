export const defaultLocale = "ja";
export const locales = ["ja", "en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const localeNames = {
  ja: "日本語",
  en: "English",
  zh: "中文",
} as const;

// 从Google Sheets获取翻译数据的配置
export const TRANSLATION_SHEET_CONFIG = {
  sheetId: process.env.NEXT_PUBLIC_TRANSLATION_SHEET_ID,
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY,
  range: "Translations!A:Z",
};
