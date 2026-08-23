import { Transaction, Expense } from '../../../shared/domain/entities';
import { ITransactionRepo, IExpenseRepo } from './interfaces';

export type DailyReport = {
  date: Date;
  totalIncome: number;
  totalOutcome: number;
  netTotal: number;
  transactions: Transaction[];
  expenses: Expense[];
};

export class GenerateDailyReport {
  constructor(
    private transactionRepo: ITransactionRepo,
    private expenseRepo: IExpenseRepo
  ) {}

  async execute(date: Date): Promise<DailyReport> {
    const transactions = await this.transactionRepo.getTransactionsForDay(date);
    const expenses = await this.expenseRepo.getExpensesForDay(date);

    const totalIncome = transactions.reduce((sum, t) => sum + Number(t.amount) + Number(t.tip), 0);
    const totalOutcome = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    return {
      date,
      totalIncome,
      totalOutcome,
      netTotal: totalIncome - totalOutcome,
      transactions,
      expenses
    };
  }
}
