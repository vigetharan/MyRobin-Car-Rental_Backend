import { RentalRepository } from '../ports/RentalRepository';
import { RentalStatus } from '../../../domain/enums/RentalStatus';

export interface RentalStats {
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  cancelledRentals: number;
  pendingRentals: number;
  totalRevenue: number;
}

export class GetRentalStatsUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(): Promise<RentalStats> {
    const allRentals = await this.rentalRepository.findAll();

    const stats: RentalStats = {
      totalRentals: allRentals.length,
      activeRentals: 0,
      completedRentals: 0,
      cancelledRentals: 0,
      pendingRentals: 0,
      totalRevenue: 0,
    };

    for (const rental of allRentals) {
      switch (rental.status) {
        case RentalStatus.ACTIVE:
          stats.activeRentals++;
          stats.totalRevenue += rental.totalPrice;
          break;
        case RentalStatus.COMPLETED:
          stats.completedRentals++;
          stats.totalRevenue += rental.totalPrice;
          break;
        case RentalStatus.CANCELLED:
          stats.cancelledRentals++;
          break;
        case RentalStatus.PENDING:
          stats.pendingRentals++;
          break;
      }
    }

    return stats;
  }
}
