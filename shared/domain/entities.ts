export type Customer = {
  id: string;
  name?: string;
  phoneNumber?: string;
  loyaltyHeroId?: string;
  googleId?: string;
  email?: string;
  createdAt?: Date;
};

export type StaffRole = 'hero' | 'helper';

export type Staff = {
  id: string;
  name: string;
  role: StaffRole;
  bonusTypeId: string;
};

export type Service = {
  id: string;
  name: string;
};

export type QueueTicketStatus = 'waiting' | 'with_hero' | 'done';
export type ReservationStatus = 'active' | 'declined' | 'completed' | 'no_show' | 'expired';

export type QueueTicket = {
  id: string;
  customerId?: string | null;
  heroId?: string;
  serviceId: string;
  status: QueueTicketStatus;
  reservationStatus?: ReservationStatus;
  joinedAt: Date;
  position?: number;
  phoneNumber?: string;
};

export type Transaction = {
  id: string;
  staffId: string;
  serviceId: string;
  amount: number;
  tip: number;
  ticketId: string;
  timestamp: Date;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  timestamp: Date;
  productId?: string;
};

export type BonusKind = 'percentage_commission' | 'flat_per_customer' | 'tiered_threshold' | 'manual';

export type BonusType = {
  id: string;
  name: string;
  kind: BonusKind;
  params: any;
};

export type Product = {
  id: string;
  name: string;
  stockQty: number;
  lowStockThreshold: number;
  unitCost: number;
  salePrice?: number;
};

export type ShopSettings = {
  id: string;
  queueAcceptingRemote: boolean;
};

export type StaffServiceDuration = {
  staffId: string;
  serviceId: string;
  rollingAvgSeconds: number;
  sampleCount: number;
};
