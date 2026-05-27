import { CurrencyService } from "@/domain/CurrencyService";
import { HttpClient } from "./http/HttpClient";
import { DomainError } from "@/domain/Errors";
import { z } from "zod";

const currencyProductSchema = z
  .object({
    iso_code: z.string(),
    buy_rate: z.union([z.string(), z.number()]).transform((val) => String(val)),
  })
  .loose();

const fxProductsResponseSchema = z.array(currencyProductSchema);

const trmResponseSchema = z
  .object({
    rate: z
      .union([z.string(), z.number()])
      .nullish()
      .transform((val) => (val !== null && val !== undefined) ? String(val) : undefined),
  })
  .loose();

export class HttpCurrencyService implements CurrencyService {
  async getExchangeRate(baseCurrency: string): Promise<number> {
    try {
      const response = await HttpClient.get(
        "/api/v1/fx/products?include_inactive=false",
      );
      if (response.ok) {
        const rawJson = await response.json();
        const fxProducts = fxProductsResponseSchema.parse(rawJson);
        const product = fxProducts.find(
          (p) => p.iso_code === baseCurrency.toUpperCase(),
        );
        if (product) {
          return parseFloat(product.buy_rate);
        }
      }
    } catch {
      // Failed to fetch rate from FX products, try TRM fallback silently
    }

    // Fallback to standard TRM service from Colombian Central Bank (banrep)
    try {
      const trmResponse = await HttpClient.get(
        `/api/v1/currency/trm/${baseCurrency.toUpperCase()}`,
      );
      if (trmResponse.ok) {
        const rawJson = await trmResponse.json();
        const trmData = trmResponseSchema.safeParse(rawJson);
        if (trmData.success && trmData.data.rate !== undefined) {
          return parseFloat(trmData.data.rate);
        }
      }
    } catch {
      // Silently proceed to throw standard error
    }

    throw new DomainError(
      "exchange_rate_unavailable",
      `Exchange rate for currency ${baseCurrency} is currently unavailable`,
      { currency: baseCurrency }
    );
  }

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (toCurrency.toUpperCase() !== "COP") {
      throw new DomainError(
        "validation_error",
        `La moneda de destino ${toCurrency} no está soportada. Solo se admite COP.`
      );
    }
    const rate = await this.getExchangeRate(fromCurrency);
    return amount * rate;
  }
}

export const currencyService = new HttpCurrencyService();
