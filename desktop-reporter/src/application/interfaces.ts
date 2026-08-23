import type { 
  Transaction,
  Product,
  QueueTicket,
  Expense,
  Staff,
  BonusType,
  Service
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

export interface IStaffRepo {
  getById(id: string): Promise<Staff | null>;
  getAll(): Promise<Staff[]>;
  update(staff: Staff): Promise<void>;
}

export interface IBonusTypeRepo {
  getById(id: string): Promise<BonusType | null>;
  getAll(): Promise<BonusType[]>;
  update(bonusType: BonusType): Promise<void>;
}

export interface IServiceRepo {
  getAll(): Promise<Service[]>;
}
