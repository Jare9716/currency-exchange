import { z } from "zod";
import { es } from "zod/locales";
import i18next from "i18next";
import apiTranslation from "./locales/es.json";

// Configure Zod 4 native Spanish error messages globally
z.config(es());

// Initialize i18next purely for custom API response translations
i18next.init({
  lng: "es",
  resources: {
    es: {
      api: apiTranslation,
    },
  },
});

/**
 * Translates an API error code or detail message to Spanish using i18next.
 * Falls back to the original message if no translation is found.
 */
export function translateApiError(errorCode: string | undefined, defaultDetail: string): string {
  // 1. Try to translate standard error code if present
  if (errorCode) {
    const key = errorCode.trim();
    if (i18next.exists(`api:${key}`)) {
      return i18next.t(`api:${key}`);
    }
  }

  // 2. Try to translate standard detail message if present
  if (defaultDetail) {
    const key = defaultDetail.trim();
    if (i18next.exists(`api:${key}`)) {
      return i18next.t(`api:${key}`);
    }
  }

  return defaultDetail;
}

export { i18next };
