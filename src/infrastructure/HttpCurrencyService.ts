import { CurrencyService } from "@/domain/CurrencyService";
import { HttpClient } from "./http/HttpClient";

interface CurrencyProduct {
  iso_code: string;
  buy_rate: string;
  [key: string]: unknown;
}

export class HttpCurrencyService implements CurrencyService {
  async getExchangeRate(baseCurrency: string): Promise<number> {
    const response = await HttpClient.get("/api/v1/fx/products?include_inactive=false");
    const data = (await response.json()) as CurrencyProduct[];
    
    const product = data.find((p) => p.iso_code === baseCurrency.toUpperCase());
    
    if (!product) {
      throw new Error(`Currency ${baseCurrency} not found`);
    }

    return parseFloat(product.buy_rate);
  }

  async convertCurrency(amount: number, fromCurrency: string): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency);
    return amount * rate;
  }
}

export const currencyService = new HttpCurrencyService();
