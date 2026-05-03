import { CurrencyService } from "@/domain/CurrencyService";

export class ConvertCurrency {
  constructor(private currencyService: CurrencyService) {}

  async execute(amount: number, fromCurrency: string = "USD", toCurrency: string = "COP"): Promise<number> {
    if (amount <= 0) return 0;
    return await this.currencyService.convertCurrency(amount, fromCurrency, toCurrency);
  }
}
