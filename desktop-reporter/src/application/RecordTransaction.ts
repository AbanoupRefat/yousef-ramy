import type {  Transaction  } from '../../../shared/domain/entities';
import type {  ITransactionRepo  } from './interfaces';
import { RecordProductUsage } from './RecordProductUsage';
import { CompleteAndAdvance } from './CompleteAndAdvance';

export class RecordTransaction {
  constructor(
    private transactionRepo: ITransactionRepo,
    private recordProductUsage: RecordProductUsage,
    private completeAndAdvance: CompleteAndAdvance
  ) {}

  async execute(
    staffId: string,
    serviceId: string,
    amount: number,
    tip: number,
    ticketId: string,
    usedProducts: { productId: string; quantity: number }[]
  ): Promise<void> {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      staffId,
      serviceId,
      amount,
      tip,
      ticketId,
      timestamp: new Date()
    };

    // Record the transaction
    await this.transactionRepo.save(transaction);

    // Decrement stock for used/sold products
    for (const item of usedProducts) {
      await this.recordProductUsage.execute(item.productId, item.quantity);
    }

    // Complete the ticket and auto-advance
    await this.completeAndAdvance.execute(ticketId);
  }
}
