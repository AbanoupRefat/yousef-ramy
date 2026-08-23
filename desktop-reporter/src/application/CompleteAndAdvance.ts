import type {  IQueueTicketRepo, IStaffServiceDurationRepo  } from './interfaces';

export class CompleteAndAdvance {
  private ticketRepo: IQueueTicketRepo;
  private durationRepo: IStaffServiceDurationRepo;

  constructor(
    ticketRepo: IQueueTicketRepo,
    durationRepo: IStaffServiceDurationRepo
  ) {
    this.ticketRepo = ticketRepo;
    this.durationRepo = durationRepo;
  }

  async execute(ticketId: string): Promise<void> {
    const ticket = await this.ticketRepo.getById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    if (ticket.status !== 'with_hero') {
      throw new Error(`Ticket is not with hero, current status: ${ticket.status}`);
    }

    // 1. Calculate actual duration (using joinedAt as proxy for now per MVP)
    const actualDurationSeconds = Math.floor((Date.now() - ticket.joinedAt.getTime()) / 1000);
    
    // 2. Update EMA
    if (ticket.heroId) {
      let duration = await this.durationRepo.getDuration(ticket.heroId, ticket.serviceId);
      if (!duration) {
        duration = {
          staffId: ticket.heroId,
          serviceId: ticket.serviceId,
          rollingAvgSeconds: actualDurationSeconds,
          sampleCount: 1
        };
      } else {
        const oldAvg = duration.rollingAvgSeconds;
        duration.rollingAvgSeconds = Math.floor(0.3 * actualDurationSeconds + 0.7 * oldAvg);
        duration.sampleCount += 1;
      }
      await this.durationRepo.saveDuration(duration);
    }

    // 3. Complete the current ticket
    ticket.status = 'done';
    await this.ticketRepo.update(ticket);

    // 4. Auto-advance rule & recompute positions
    if (ticket.heroId) {
      const waitingTickets = await this.ticketRepo.getWaitingTickets(ticket.heroId);
      if (waitingTickets.length > 0) {
        // Sort by position primarily, fallback to joinedAt
        waitingTickets.sort((a, b) => {
          if (a.position !== undefined && b.position !== undefined) {
            return a.position - b.position;
          }
          return a.joinedAt.getTime() - b.joinedAt.getTime();
        });

        // The first ticket goes to with_hero
        const nextTicket = waitingTickets[0];
        nextTicket.status = 'with_hero';
        // We can optionally set position to null or -1 for with_hero, but let's just leave it or set 0

        // Shift everyone else's position down by 1
        for (let i = 1; i < waitingTickets.length; i++) {
          waitingTickets[i].position = i - 1;
        }

        // Save batch
        await this.ticketRepo.updateBatch(waitingTickets);
      }
    }
  }
}
