import { RentalRepository } from '../ports/RentalRepository';
import { Rental } from '../../../domain/rental/Rental';

export class GetUserRentalsUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(userId: string): Promise<Rental[]> {
    return this.rentalRepository.findByUserId(userId);
  }
}

export class GetAllRentalsUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(): Promise<Rental[]> {
    return this.rentalRepository.findAll();
  }
}
