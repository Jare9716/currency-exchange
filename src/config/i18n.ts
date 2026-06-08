import { z } from "zod";
import { es } from "zod/locales";
import i18next from "i18next";
import apiTranslation from "./locales/es.json";

// Configure Zod 4 native Spanish error messages globally
z.config(es());

// Initialize i18next purely for custom API response translations
i18next.init({
  lng: "es",
  keySeparator: false,
  resources: {
    es: {
      api: apiTranslation,
    },
  },
});

/**
 * Translates an API error code to Spanish using i18next.
 * Falls back to the original message if the error code is not translated.
 */
export function translateApiError(errorCode: string | undefined, defaultDetail: string): string {
  if (errorCode) {
    const key = errorCode.trim();
    if (key in apiTranslation) {
      return i18next.t(key, { ns: "api" });
    }
  }

  // Gracefully fallback if errorCode is missing or not found
  return defaultDetail;
}

export { i18next };
