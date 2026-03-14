export interface Transaction {
  id: string;
  userId: string;
  amountUSD: number;
  exchangeRate: number;
  amountCOP: number;
  date: Date;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findByUserId(userId: string): Promise<Transaction[]>;
}
