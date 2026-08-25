import type { IQueueTicketRepo, IShopSettingsRepo, IStaffServiceDurationRepo } from './interfaces';
import type { QueueTicket, QueueTicketStatus } from '../../../shared/domain/entities';

// Generate UUID simple polyfill for MVP
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class QueueManagementUseCases {
  private ticketRepo: IQueueTicketRepo;
  private settingsRepo: IShopSettingsRepo;
  private durationRepo: IStaffServiceDurationRepo;

  constructor(
    ticketRepo: IQueueTicketRepo,
    settingsRepo: IShopSettingsRepo,
    durationRepo: IStaffServiceDurationRepo
  ) {
    this.ticketRepo = ticketRepo;
    this.settingsRepo = settingsRepo;
    this.durationRepo = durationRepo;
  }

  async joinQueue(customerId: string | null, serviceId: string, heroId: string, phoneNumber: string): Promise<QueueTicket> {
    const normalizedPhone = phoneNumber.trim();
    if (!normalizedPhone) throw new Error('Phone number is required');
    const settings = await this.settingsRepo.getSettings();
    if (!settings.queueAcceptingRemote) {
      throw new Error('Reservations temporarily closed');
    }

    if (customerId) {
      const activeCount = await this.ticketRepo.countForCustomerToday(customerId, ['active']);
      const declinedCount = await this.ticketRepo.countForCustomerToday(customerId, ['declined']);
      const totalUsed = activeCount + declinedCount;
      if (totalUsed >= 2) {
        throw new Error("You've used your 2 reservations for today. Please try again tomorrow.");
      }
    }

    const waitingTickets = await this.ticketRepo.getWaitingTickets(heroId);
    let maxPosition = -1;
    for (const t of waitingTickets) {
      if (t.position !== undefined && t.position > maxPosition) {
        maxPosition = t.position;
      }
    }

    const newTicket: QueueTicket = {
      id: uuidv4(),
      customerId,
      heroId,
      serviceId,
      status: 'waiting',
      reservationStatus: 'active',
      joinedAt: new Date(),
      position: maxPosition + 1,
      phoneNumber: normalizedPhone
    };

    await this.ticketRepo.create(newTicket);
    return newTicket;
  }

  async getQueueStatus(ticketId: string): Promise<{ position: number, etaSeconds: number, status: QueueTicketStatus }> {
    const ticket = await this.ticketRepo.getById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    if (ticket.status !== 'waiting' || ticket.position === undefined || !ticket.heroId) {
      return { position: ticket.position || 0, etaSeconds: 0, status: ticket.status };
    }

    const duration = await this.durationRepo.getDuration(ticket.heroId, ticket.serviceId);
    // Use 15 mins default if no EMA exists yet
    const avgSeconds = duration ? duration.rollingAvgSeconds : 15 * 60;
    
    // Position is 0-indexed. Position 0 means they are next. ETA = position * avg
    // Actually, if you are position 0, your ETA is the remaining time of the guy currently with_hero. 
    // We'll approximate by position * avgSeconds. Position 0 -> 0 ETA (or "Next").
    const etaSeconds = ticket.position * avgSeconds;

    return {
      position: ticket.position,
      etaSeconds,
      status: ticket.status
    };
  }

  async getQueueForStaff(staffId: string): Promise<QueueTicket[]> {
    const waiting = await this.ticketRepo.getWaitingTickets(staffId);
    return waiting.sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  async createManualReservation(staffId: string, serviceId: string, position: number, phoneNumber: string, customerId: string | null): Promise<QueueTicket> {
    const normalizedPhone = phoneNumber.trim();
    if (!normalizedPhone) throw new Error('Phone number is required');
    const waitingTickets = await this.getQueueForStaff(staffId);
    
    // Shift everyone at or below the target position down by 1
    const toUpdate: QueueTicket[] = [];
    for (const t of waitingTickets) {
      if (t.position !== undefined && t.position >= position) {
        t.position += 1;
        toUpdate.push(t);
      }
    }
    
    const newTicket: QueueTicket = {
      id: uuidv4(),
      customerId,
      heroId: staffId,
      serviceId,
      status: 'waiting',
      reservationStatus: 'active',
      joinedAt: new Date(),
      position: position,
      phoneNumber: normalizedPhone
    };

    if (toUpdate.length > 0) {
      await this.ticketRepo.updateBatch(toUpdate);
    }
    await this.ticketRepo.create(newTicket);
    
    return newTicket;
  }

  async reorderQueue(staffId: string, ticketId: string, newPosition: number): Promise<void> {
    const waitingTickets = await this.getQueueForStaff(staffId);
    const oldIndex = waitingTickets.findIndex(t => t.id === ticketId);
    if (oldIndex === -1) return;

    const ticketToMove = waitingTickets.splice(oldIndex, 1)[0];
    
    // Clamp newPosition
    const clampedPosition = Math.max(0, Math.min(newPosition, waitingTickets.length));
    waitingTickets.splice(clampedPosition, 0, ticketToMove);

    // Reassign all positions
    for (let i = 0; i < waitingTickets.length; i++) {
      waitingTickets[i].position = i;
    }

    await this.ticketRepo.updateBatch(waitingTickets);
  }

  async toggleQueueAcceptance(accepting: boolean): Promise<void> {
    const settings = await this.settingsRepo.getSettings();
    settings.queueAcceptingRemote = accepting;
    await this.settingsRepo.updateSettings(settings);
  }

  async declineReservation(ticketId: string): Promise<void> {
    const ticket = await this.ticketRepo.getById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    ticket.reservationStatus = 'declined';
    await this.ticketRepo.update(ticket);
    
    // We don't auto-advance or change the 'waiting' status because 
    // it removes them from the active queue display anyway if we handle it in frontend,
    // actually we should probably remove them from 'waiting' so they don't block.
    // Wait, the prompt says: "doesn't auto-advance the queue" "If this ticket was with_hero, we need to manually advance".
    // Wait, if they are 'waiting', they are still in the queue but marked as declined.
    // If we leave them as 'waiting', they stay in maxPosition logic.
    // Let's just update reservationStatus for now as requested.
  }

  async markNoShow(ticketId: string): Promise<void> {
    const ticket = await this.ticketRepo.getById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    ticket.reservationStatus = 'no_show';
    await this.ticketRepo.update(ticket);
  }

  async deleteTicket(staffId: string, ticketId: string): Promise<void> {
    await this.ticketRepo.delete(ticketId);
    
    // Re-index remaining waiting tickets
    const waitingTickets = await this.getQueueForStaff(staffId);
    for (let i = 0; i < waitingTickets.length; i++) {
      waitingTickets[i].position = i;
    }
    if (waitingTickets.length > 0) {
      await this.ticketRepo.updateBatch(waitingTickets);
    }
  }

  async cleanupEndOfDay(): Promise<{ expiredCount: number, noShowCount: number }> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const now = new Date();

    const expiredCount = await this.ticketRepo.updateMany(
      { status: 'waiting', joinedAtGte: startOfToday, joinedAtLte: now },
      { reservationStatus: 'expired', status: 'cancelled' }
    );

    const noShowCount = await this.ticketRepo.updateMany(
      { status: 'with_hero', joinedAtGte: startOfToday, joinedAtLte: now },
      { reservationStatus: 'no_show', status: 'done' }
    );

    return { expiredCount, noShowCount };
  }
}
