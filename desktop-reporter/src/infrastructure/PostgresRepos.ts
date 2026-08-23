import { supabase } from './SupabaseClient';
import { Transaction, Product, QueueTicket, Expense, Staff, BonusType } from '../../../shared/domain/entities';
import { ITransactionRepo, IProductRepo, IQueueTicketRepo, IExpenseRepo, IStaffRepo, IBonusTypeRepo } from '../application/interfaces';

export class PostgresTransactionRepo implements ITransactionRepo {
  async save(transaction: Transaction): Promise<void> {
    const { error } = await supabase.from('transactions').insert({
      id: transaction.id,
      staff_id: transaction.staffId,
      service_id: transaction.serviceId,
      amount: transaction.amount,
      tip: transaction.tip,
      ticket_id: transaction.ticketId,
      timestamp: transaction.timestamp.toISOString()
    });
    if (error) throw new Error(error.message);
  }

  async getTransactionsForDay(date: Date): Promise<Transaction[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString());

    if (error) throw new Error(error.message);

    return data.map(row => ({
      id: row.id,
      staffId: row.staff_id,
      serviceId: row.service_id,
      amount: row.amount,
      tip: row.tip,
      ticketId: row.ticket_id,
      timestamp: new Date(row.timestamp)
    }));
  }
}

export class PostgresProductRepo implements IProductRepo {
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw new Error(error.message);
    }
    return this.mapRowToProduct(data);
  }

  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw new Error(error.message);
    return data.map(this.mapRowToProduct);
  }

  async update(product: Product): Promise<void> {
    const { error } = await supabase.from('products').update({
      name: product.name,
      stock_qty: product.stockQty,
      low_stock_threshold: product.lowStockThreshold,
      unit_cost: product.unitCost,
      sale_price: product.salePrice
    }).eq('id', product.id);
    if (error) throw new Error(error.message);
  }

  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      stockQty: row.stock_qty,
      lowStockThreshold: row.low_stock_threshold,
      unitCost: row.unit_cost,
      salePrice: row.sale_price
    };
  }
}

export class PostgresQueueTicketRepo implements IQueueTicketRepo {
  async getById(id: string): Promise<QueueTicket | null> {
    const { data, error } = await supabase.from('queue_tickets').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return this.mapRowToTicket(data);
  }

  async update(ticket: QueueTicket): Promise<void> {
    const { error } = await supabase.from('queue_tickets').update({
      status: ticket.status
    }).eq('id', ticket.id);
    if (error) throw new Error(error.message);
  }

  async getWaitingTickets(heroId: string): Promise<QueueTicket[]> {
    const { data, error } = await supabase.from('queue_tickets')
      .select('*')
      .eq('hero_id', heroId)
      .eq('status', 'waiting');
    if (error) throw new Error(error.message);
    return data.map(this.mapRowToTicket);
  }

  async getTicketsWithHero(heroId: string): Promise<QueueTicket[]> {
    const { data, error } = await supabase.from('queue_tickets')
      .select('*')
      .eq('hero_id', heroId)
      .eq('status', 'with_hero');
    if (error) throw new Error(error.message);
    return data.map(this.mapRowToTicket);
  }

  async getAllTickets(): Promise<QueueTicket[]> {
    const { data, error } = await supabase.from('queue_tickets').select('*');
    if (error) throw new Error(error.message);
    return data.map(this.mapRowToTicket);
  }

  private mapRowToTicket(row: any): QueueTicket {
    return {
      id: row.id,
      customerId: row.customer_id,
      heroId: row.hero_id,
      serviceId: row.service_id,
      status: row.status as any,
      joinedAt: new Date(row.joined_at)
    };
  }
}

export class PostgresExpenseRepo implements IExpenseRepo {
  async save(expense: Expense): Promise<void> {
    const { error } = await supabase.from('expenses').insert({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      product_id: expense.productId || null,
      timestamp: expense.timestamp.toISOString()
    });
    if (error) throw new Error(error.message);
  }

  async getExpensesForDay(date: Date): Promise<Expense[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString());

    if (error) throw new Error(error.message);

    return data.map(row => ({
      id: row.id,
      description: row.description,
      amount: row.amount,
      productId: row.product_id,
      timestamp: new Date(row.timestamp)
    }));
  }
}

export class PostgresStaffRepo implements IStaffRepo {
  async getById(id: string): Promise<Staff | null> {
    const { data, error } = await supabase.from('staff').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return this.mapRowToStaff(data);
  }

  async getAll(): Promise<Staff[]> {
    const { data, error } = await supabase.from('staff').select('*');
    if (error) throw new Error(error.message);
    return data.map(this.mapRowToStaff);
  }

  async update(staff: Staff): Promise<void> {
    const { error } = await supabase.from('staff').update({
      name: staff.name,
      role: staff.role,
      bonus_type_id: staff.bonusTypeId
    }).eq('id', staff.id);
    if (error) throw new Error(error.message);
  }

  private mapRowToStaff(row: any): Staff {
    return {
      id: row.id,
      name: row.name,
      role: row.role as any,
      bonusTypeId: row.bonus_type_id
    };
  }
}

export class PostgresBonusTypeRepo implements IBonusTypeRepo {
  async getById(id: string): Promise<BonusType | null> {
    const { data, error } = await supabase.from('bonus_types').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return this.mapRowToBonusType(data);
  }

  async getAll(): Promise<BonusType[]> {
    const { data, error } = await supabase.from('bonus_types').select('*');
    if (error) throw new Error(error.message);
    return data.map(this.mapRowToBonusType);
  }

  async update(bonusType: BonusType): Promise<void> {
    const { error } = await supabase.from('bonus_types').update({
      name: bonusType.name,
      kind: bonusType.kind,
      params: bonusType.params
    }).eq('id', bonusType.id);
    if (error) throw new Error(error.message);
  }

  private mapRowToBonusType(row: any): BonusType {
    return {
      id: row.id,
      name: row.name,
      kind: row.kind as any,
      params: row.params
    };
  }
}
