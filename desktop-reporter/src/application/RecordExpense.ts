import type {  Expense  } from '../../../shared/domain/entities';
import type {  IExpenseRepo  } from './interfaces';

export class RecordExpense {
  constructor(private expenseRepo: IExpenseRepo) {}

  async execute(description: string, amount: number, productId?: string): Promise<void> {
    const expense: Expense = {
      id: crypto.randomUUID(),
      description,
      amount,
      timestamp: new Date(),
      productId
    };

    await this.expenseRepo.save(expense);
  }
}
