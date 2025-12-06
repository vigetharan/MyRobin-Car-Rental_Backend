import { RentalRepository } from '../ports/RentalRepository';

export class GetCarUnavailableDatesUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(carId: string): Promise<{ startDate: Date; endDate: Date }[]> {
    return this.rentalRepository.getUnavailableDates(carId);
  }
}
