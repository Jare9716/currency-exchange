import { ExecuteTransaction } from '@/use-cases/ExecuteTransaction';
import { TransactionRepository } from '@/domain/Transaction';
import { DomainError } from '@/domain/Errors';

describe('ExecuteTransaction', () => {
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let executeTransaction: ExecuteTransaction;

  beforeEach(() => {
    transactionRepository = {
      save: jest.fn(),
      findByCustomerId: jest.fn(),
    } as unknown as jest.Mocked<TransactionRepository>;
    executeTransaction = new ExecuteTransaction(transactionRepository);
  });

  describe('when executing a transaction', () => {
    it('should calculate the COP amount correctly and save the transaction', async () => {
      // Arrange
      const customerId = 'customer-123';
      const amountUSD = 100;
      const exchangeRate = 4000;

      // Act
      const result = await executeTransaction.execute(customerId, amountUSD, exchangeRate);

      // Assert
      expect(result.amountCOP).toBe(400000);
      expect(result.customerId).toBe(customerId);
      expect(transactionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        customerId,
        amountUSD,
        amountCOP: 400000,
      }));
    });

    it('should throw a DomainError if amountUSD is zero or negative', async () => {
      // Arrange
      const customerId = 'customer-123';
      const amountUSD = 0;
      const exchangeRate = 4000;

      // Act & Assert
      await expect(executeTransaction.execute(customerId, amountUSD, exchangeRate))
        .rejects
        .toThrow(DomainError);
    });
  });
});
