import { RentalRepository } from '../ports/RentalRepository';
import { Rental } from '../../../domain/rental/Rental';

export class GetUserActiveRentalsUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(userId: number): Promise<Rental[]> {
    return this.rentalRepository.findActiveByUserId(userId);
  }
}
