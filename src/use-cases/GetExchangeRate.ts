import { CurrencyService } from "@/domain/CurrencyService";

export class GetExchangeRate {
  constructor(private currencyService: CurrencyService) {}

  async execute(baseCurrency: string = "USD"): Promise<number> {
    return await this.currencyService.getExchangeRate(baseCurrency);
  }
}
