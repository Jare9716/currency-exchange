import { HttpCurrencyService } from '@/infrastructure/HttpCurrencyService';
import { HttpClient } from '@/infrastructure/http/HttpClient';

jest.mock('@/infrastructure/http/HttpClient');

describe('HttpCurrencyService', () => {
  let service: HttpCurrencyService;

  beforeEach(() => {
    service = new HttpCurrencyService();
    jest.clearAllMocks();
  });

  it('should fetch and return the correct exchange rate', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([
        { iso_code: 'USD', buy_rate: '4000.50' },
        { iso_code: 'EUR', buy_rate: '4300.00' }
      ]),
    };
    (HttpClient.get as jest.Mock).mockResolvedValue(mockResponse);
 
    const rate = await service.getExchangeRate('USD');
 
    expect(HttpClient.get).toHaveBeenCalledWith('/api/v1/fx/products?include_inactive=false');
    expect(rate).toBe(4000.50);
  });
 
  it('should throw an error if currency is not found', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([{ iso_code: 'EUR', buy_rate: '4300.00' }]),
    };
    (HttpClient.get as jest.Mock).mockResolvedValue(mockResponse);
 
    await expect(service.getExchangeRate('USD')).rejects.toThrow('Currency USD not found');
  });
 
  it('should convert currency using fetched rate', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([{ iso_code: 'USD', buy_rate: '4000' }]),
    };
    (HttpClient.get as jest.Mock).mockResolvedValue(mockResponse);
 
    const result = await service.convertCurrency(100, 'USD', 'COP');
 
    expect(result).toBe(400000);
  });
});
