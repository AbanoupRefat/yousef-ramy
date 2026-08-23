import { IQueueTicketRepo } from './interfaces';

export class CompleteAndAdvance {
  constructor(private ticketRepo: IQueueTicketRepo) {}

  async execute(ticketId: string): Promise<void> {
    const ticket = await this.ticketRepo.getById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    if (ticket.status !== 'with_hero') {
      throw new Error(`Ticket is not with hero, current status: ${ticket.status}`);
    }

    // Complete the current ticket
    ticket.status = 'done';
    await this.ticketRepo.update(ticket);

    // Auto-advance rule: flip next waiting ticket to with_hero
    if (ticket.heroId) {
      const waitingTickets = await this.ticketRepo.getWaitingTickets(ticket.heroId);
      if (waitingTickets.length > 0) {
        // Find the oldest waiting ticket for this hero
        waitingTickets.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
        const nextTicket = waitingTickets[0];
        nextTicket.status = 'with_hero';
        await this.ticketRepo.update(nextTicket);
      }
    }
  }
}
