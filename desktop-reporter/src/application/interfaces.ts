import {
  Transaction,
  Product,
  QueueTicket,
  Expense
} from '../../../shared/domain/entities';

export interface ITransactionRepo {
  save(transaction: Transaction): Promise<void>;
  getTransactionsForDay(date: Date): Promise<Transaction[]>;
}

export interface IProductRepo {
  getById(id: string): Promise<Product | null>;
  getAll(): Promise<Product[]>;
  update(product: Product): Promise<void>;
}

export interface IQueueTicketRepo {
  getById(id: string): Promise<QueueTicket | null>;
  update(ticket: QueueTicket): Promise<void>;
  // For manual stub logic:
  getWaitingTickets(heroId: string): Promise<QueueTicket[]>;
  getTicketsWithHero(heroId: string): Promise<QueueTicket[]>;
  getAllTickets(): Promise<QueueTicket[]>;
}

export interface IExpenseRepo {
  save(expense: Expense): Promise<void>;
  getExpensesForDay(date: Date): Promise<Expense[]>;
}
