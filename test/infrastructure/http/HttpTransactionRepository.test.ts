import { HttpTransactionRepository } from '@/infrastructure/http/HttpTransactionRepository';
import { HttpClient } from '@/infrastructure/http/HttpClient';
import { CreateTransactionPayload } from '@/domain/Transaction';

jest.mock('@/infrastructure/http/HttpClient');

describe('HttpTransactionRepository', () => {
  let repository: HttpTransactionRepository;

  beforeEach(() => {
    repository = new HttpTransactionRepository();
    jest.clearAllMocks();
  });

  it('should save a transaction successfully', async () => {
    const payload: CreateTransactionPayload = {
      customer_id: 'cust-1',
      transaction_type: 'buy',
      iso_code: 'USD',
      foreign_amount: '100',
    };

    const mockResponse = {
      json: jest.fn().mockResolvedValue({ id: 'txn-1', ...payload }),
    };
    (HttpClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await repository.save(payload);

    expect(HttpClient.post).toHaveBeenCalledWith('/api/v1/fx/transactions', payload);
    expect(result.id).toBe('txn-1');
  });

  it('should find transactions by customer id', async () => {
    const customerId = 'cust-1';
    const mockResponse = {
      json: jest.fn().mockResolvedValue({ items: [{ id: 'txn-1' }] }),
    };
    (HttpClient.get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await repository.findByCustomerId(customerId);

    expect(HttpClient.get).toHaveBeenCalledWith(`/api/v1/fx/transactions?customer_id=${customerId}`);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('txn-1');
  });

  it('should fetch all transactions with filters', async () => {
    const filters = { page: 1, size: 10 };
    const mockResponse = {
      json: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    (HttpClient.get as jest.Mock).mockResolvedValue(mockResponse);

    await repository.findAll(filters);

    expect(HttpClient.get).toHaveBeenCalledWith('/api/v1/fx/transactions?page=1&size=10');
  });
});
