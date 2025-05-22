import { TRANSLATION_SHEET_CONFIG } from "./config";

interface TranslationData {
  [key: string]: {
    [locale: string]: string;
  };
}

export async function fetchTranslations(): Promise<TranslationData> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${TRANSLATION_SHEET_CONFIG.sheetId}/values/${TRANSLATION_SHEET_CONFIG.range}?key=${TRANSLATION_SHEET_CONFIG.apiKey}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch translations");
    }

    const data = await response.json();
    return processSheetData(data.values);
  } catch (error) {
    console.error("Error fetching translations:", error);
    return {};
  }
}

function processSheetData(values: string[][]): TranslationData {
  const translations: TranslationData = {};
  const headers = values[0];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const key = row[0];
    translations[key] = {};

    for (let j = 1; j < headers.length; j++) {
      translations[key][headers[j]] = row[j] || "";
    }
  }

  return translations;
}
