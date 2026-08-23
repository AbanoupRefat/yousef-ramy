import type {  IStaffRepo, IBonusTypeRepo  } from './interfaces';
import type {  BonusKind  } from '../../../shared/domain/entities';

export class UpdateBonusType {
  constructor(
    private staffRepo: IStaffRepo,
    private bonusTypeRepo: IBonusTypeRepo
  ) {}

  async execute(staffId: string, kind: BonusKind, params: any): Promise<void> {
    const staff = await this.staffRepo.getById(staffId);
    if (!staff) throw new Error('Staff not found');

    const bonusType = await this.bonusTypeRepo.getById(staff.bonusTypeId);
    if (!bonusType) throw new Error('Bonus type not found');

    // Update the bonus type details
    bonusType.kind = kind;
    bonusType.params = params;

    await this.bonusTypeRepo.update(bonusType);
  }
}
