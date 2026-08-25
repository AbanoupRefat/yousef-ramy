import type { 
  Transaction,
  Product,
  QueueTicket,
  Expense,
  Staff,
  BonusType,
  Service,
  ShopSettings,
  StaffServiceDuration,
  ReservationStatus,
  StaffSchedule
 } from '../../../shared/domain/entities';

export interface ITransactionRepo {
  save(transaction: Transaction): Promise<void>;
  getTransactionsForDay(date: Date): Promise<Transaction[]>;
}

export interface IProductRepo {
  getById(id: string): Promise<Product | null>;
  getAll(): Promise<Product[]>;
  create(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IQueueTicketRepo {
  getById(id: string): Promise<QueueTicket | null>;
  create(ticket: QueueTicket): Promise<void>;
  update(ticket: QueueTicket): Promise<void>;
  updateBatch(tickets: QueueTicket[]): Promise<void>;
  getWaitingTickets(heroId: string): Promise<QueueTicket[]>;
  getTicketsWithHero(heroId: string): Promise<QueueTicket[]>;
  getAllTickets(): Promise<QueueTicket[]>;
  countForCustomerToday(customerId: string, statuses: ReservationStatus[]): Promise<number>;
  updateMany(filter: { status?: string; joinedAtGte?: Date; joinedAtLte?: Date }, update: { reservationStatus: ReservationStatus; status?: any }): Promise<number>;
  delete(ticketId: string): Promise<void>;
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

export interface IShopSettingsRepo {
  getSettings(): Promise<ShopSettings>;
  updateSettings(settings: ShopSettings): Promise<void>;
}

export interface IStaffServiceDurationRepo {
  getDuration(staffId: string, serviceId: string): Promise<StaffServiceDuration | null>;
  saveDuration(duration: StaffServiceDuration): Promise<void>;
}

export interface IStaffScheduleRepo {
  getForStaff(staffId: string): Promise<StaffSchedule[]>;
  save(schedule: StaffSchedule): Promise<void>;
}
