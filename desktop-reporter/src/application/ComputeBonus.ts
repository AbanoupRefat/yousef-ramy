import type {  IStaffRepo, IBonusTypeRepo, ITransactionRepo  } from './interfaces';

export class ComputeBonus {
  constructor(
    private staffRepo: IStaffRepo,
    private bonusTypeRepo: IBonusTypeRepo,
    private transactionRepo: ITransactionRepo
  ) {}

  async execute(staffId: string, startDate: Date): Promise<number> {
    const staff = await this.staffRepo.getById(staffId);
    if (!staff) throw new Error('Staff not found');

    const bonusType = await this.bonusTypeRepo.getById(staff.bonusTypeId);
    if (!bonusType) throw new Error('Bonus type not found');

    // For simplicity, we fetch all transactions for the period
    // Since our stub only supports getTransactionsForDay, we'll fetch the start date.
    // In a real system, we'd have getTransactionsForPeriod.
    // Let's assume start and end date are the same day for this daily report use case.
    const transactions = await this.transactionRepo.getTransactionsForDay(startDate);
    
    // Filter transactions by staff
    const staffTransactions = transactions.filter(t => t.staffId === staffId);

    const totalRevenue = staffTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalCustomers = staffTransactions.length;

    let bonus = 0;

    switch (bonusType.kind) {
      case 'percentage_commission':
        // params: { percent: number }
        const percent = bonusType.params.percent || 0;
        bonus = totalRevenue * (percent / 100);
        break;

      case 'flat_per_customer':
        // params: { amount: number }
        const flatAmount = bonusType.params.amount || 0;
        bonus = totalCustomers * flatAmount;
        break;

      case 'tiered_threshold':
        // params: { threshold: number, bonus_above: number }
        const threshold = bonusType.params.threshold || 0;
        const bonusAbove = bonusType.params.bonus_above || 0;
        if (totalRevenue > threshold) {
          bonus = bonusAbove;
        }
        break;

      case 'manual':
        // params: { default_bonus: number }
        bonus = bonusType.params.default_bonus || 0;
        break;

      default:
        throw new Error(`Unknown bonus kind: ${bonusType.kind}`);
    }

    return bonus;
  }
}
