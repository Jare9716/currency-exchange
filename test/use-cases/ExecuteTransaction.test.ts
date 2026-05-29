import { ExecuteTransaction } from '@/use-cases/ExecuteTransaction';
import { TransactionRepository, Transaction } from '@/domain/Transaction';
import { DomainError } from '@/domain/Errors';

describe('ExecuteTransaction', () => {
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let executeTransaction: ExecuteTransaction;

  beforeEach(() => {
    transactionRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<TransactionRepository>;
    executeTransaction = new ExecuteTransaction(transactionRepository);
  });

  describe('when executing a transaction', () => {
    it('should call repository with correct data and return the transaction', async () => {
      // Arrange
      const customerId = 'customer-123';
      const amountUSD = 100;
      const mockTransaction: Transaction = {
        id: 'txn-1',
        ticket_number: 1,
        customer_id: customerId,
        transaction_type: 'buy',
        iso_code: 'USD',
        foreign_amount: '100',
        exchange_rate: '4000',
        cop_amount: '400000',
        description: 'Exchange via frontend',
        created_at: new Date().toISOString(),
      };

      transactionRepository.save.mockResolvedValue(mockTransaction);

      // Act
      const result = await executeTransaction.execute(customerId, amountUSD, 'USD', 'buy', '001');

      // Assert
      expect(result.cop_amount).toBe('400000');
      expect(result.customer_id).toBe(customerId);
      expect(transactionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        customer_id: customerId,
        foreign_amount: '100',
        iso_code: 'USD',
        transaction_type: 'buy',
        branch_code: '001',
      }));
    });

    it('should throw a DomainError if amountUSD is zero or negative', async () => {
      // Arrange
      const customerId = 'customer-123';
      const amountUSD = 0;

      // Act & Assert
      await expect(executeTransaction.execute(customerId, amountUSD, 'USD', 'buy', '001'))
        .rejects
        .toThrow(DomainError);
    });
  });
});
