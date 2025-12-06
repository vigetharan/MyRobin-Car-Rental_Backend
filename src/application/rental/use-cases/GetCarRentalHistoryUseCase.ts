import { RentalRepository } from '../ports/RentalRepository';
import { Rental } from '../../../domain/rental/Rental';

export class GetCarRentalHistoryUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(carId: string): Promise<Rental[]> {
    return this.rentalRepository.findByCarId(carId);
  }
}
