export interface CurrencyService {
  getExchangeRate(baseCurrency: string): Promise<number>;
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number>;
}
