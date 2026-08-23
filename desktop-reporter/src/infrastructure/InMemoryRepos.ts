import { Transaction, Product, QueueTicket, Expense, Staff, Service } from '../../../shared/domain/entities';
import { ITransactionRepo, IProductRepo, IQueueTicketRepo, IExpenseRepo } from '../application/interfaces';

export class InMemoryTransactionRepo implements ITransactionRepo {
  private transactions: Transaction[] = [];

  async save(transaction: Transaction): Promise<void> {
    this.transactions.push(transaction);
  }

  async getTransactionsForDay(date: Date): Promise<Transaction[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.transactions.filter(t => t.timestamp >= startOfDay && t.timestamp <= endOfDay);
  }
}

export class InMemoryProductRepo implements IProductRepo {
  // Pre-seed some products so we can test the UI
  private products: Product[] = [
    { id: 'prod-1', name: 'Pomade', stockQty: 10, lowStockThreshold: 5, unitCost: 8, salePrice: 15 },
    { id: 'prod-2', name: 'Shave Gel', stockQty: 4, lowStockThreshold: 5, unitCost: 5, salePrice: 10 }, // low stock
    { id: 'prod-3', name: 'Aftershave', stockQty: 20, lowStockThreshold: 5, unitCost: 12, salePrice: 20 },
  ];

  async getById(id: string): Promise<Product | null> {
    return this.products.find(p => p.id === id) || null;
  }

  async getAll(): Promise<Product[]> {
    return this.products;
  }

  async update(product: Product): Promise<void> {
    const idx = this.products.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      this.products[idx] = product;
    }
  }
}

export class InMemoryQueueTicketRepo implements IQueueTicketRepo {
  // Pre-seed some tickets
  private tickets: QueueTicket[] = [
    { id: 'ticket-1', customerId: 'cust-1', heroId: 'staff-1', serviceId: 'serv-1', status: 'with_hero', joinedAt: new Date(Date.now() - 30 * 60000) },
    { id: 'ticket-2', customerId: 'cust-2', heroId: 'staff-1', serviceId: 'serv-2', status: 'waiting', joinedAt: new Date() },
  ];

  async getById(id: string): Promise<QueueTicket | null> {
    return this.tickets.find(t => t.id === id) || null;
  }

  async update(ticket: QueueTicket): Promise<void> {
    const idx = this.tickets.findIndex(t => t.id === ticket.id);
    if (idx !== -1) {
      this.tickets[idx] = ticket;
    }
  }

  async getWaitingTickets(heroId: string): Promise<QueueTicket[]> {
    return this.tickets.filter(t => t.heroId === heroId && t.status === 'waiting');
  }

  async getTicketsWithHero(heroId: string): Promise<QueueTicket[]> {
    return this.tickets.filter(t => t.heroId === heroId && t.status === 'with_hero');
  }

  async getAllTickets(): Promise<QueueTicket[]> {
    return this.tickets;
  }
}

export class InMemoryExpenseRepo implements IExpenseRepo {
  private expenses: Expense[] = [
    { id: 'exp-1', description: 'Rent', amount: 1000, timestamp: new Date() }
  ];

  async save(expense: Expense): Promise<void> {
    this.expenses.push(expense);
  }

  async getExpensesForDay(date: Date): Promise<Expense[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.expenses.filter(e => e.timestamp >= startOfDay && e.timestamp <= endOfDay);
  }
}

export class InMemoryStaffRepo implements IStaffRepo {
  private staffList: Staff[] = [
    { id: 'staff-1', name: 'John Hero', role: 'hero', bonusTypeId: 'b-1' },
    { id: 'staff-2', name: 'Mike Hero', role: 'hero', bonusTypeId: 'b-2' }
  ];

  async getById(id: string): Promise<Staff | null> {
    return this.staffList.find(s => s.id === id) || null;
  }

  async getAll(): Promise<Staff[]> {
    return this.staffList;
  }

  async update(staff: Staff): Promise<void> {
    const idx = this.staffList.findIndex(s => s.id === staff.id);
    if (idx !== -1) {
      this.staffList[idx] = staff;
    }
  }
}

export class InMemoryBonusTypeRepo implements IBonusTypeRepo {
  private bonusTypes: BonusType[] = [
    { id: 'b-1', name: 'Standard Commission', kind: 'percentage_commission', params: { percent: 10 } },
    { id: 'b-2', name: 'Flat Rate', kind: 'flat_per_customer', params: { amount: 5 } }
  ];

  async getById(id: string): Promise<BonusType | null> {
    return this.bonusTypes.find(b => b.id === id) || null;
  }

  async getAll(): Promise<BonusType[]> {
    return this.bonusTypes;
  }

  async update(bonusType: BonusType): Promise<void> {
    const idx = this.bonusTypes.findIndex(b => b.id === bonusType.id);
    if (idx !== -1) {
      this.bonusTypes[idx] = bonusType;
    }
  }
}

// Keep mockServices for UI pickers
export const mockServices: Service[] = [
  { id: 'serv-1', name: 'Buzz Cut' },
  { id: 'serv-2', name: 'Fade' },
  { id: 'serv-3', name: 'Full Grooming' }
];
