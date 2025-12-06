import { RentalRepository } from '../ports/RentalRepository';

export class GetCarUnavailableDatesUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(carId: number): Promise<{ startDate: Date; endDate: Date }[]> {
    return this.rentalRepository.getUnavailableDates(carId);
  }
}
