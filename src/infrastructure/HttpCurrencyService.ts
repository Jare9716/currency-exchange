import { CurrencyService } from "@/domain/CurrencyService";
import { API_BASE_URL } from "@/config";

export class HttpCurrencyService implements CurrencyService {
  async getExchangeRate(baseCurrency: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/v1/currency/trm/${baseCurrency.toLowerCase()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch exchange rate");
    const data = await res.json();
    return data.rate;
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/currency/trm/${fromCurrency.toLowerCase()}/convert`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          amount,
          to_currency: toCurrency,
        }),
      },
    );

    if (!res.ok) throw new Error("Failed to convert currency");
    const data = await res.json();
    return data.to_amount;
  }
}

export const currencyService = new HttpCurrencyService();
