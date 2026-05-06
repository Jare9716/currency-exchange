export interface Transaction {
  id: string;
  clientId: string;
  amountUSD: number;
  exchangeRate: number;
  amountCOP: number;
  date: Date;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findByClientId(clientId: string): Promise<Transaction[]>;
}
