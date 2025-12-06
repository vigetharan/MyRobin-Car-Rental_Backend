import { RentalRepository } from '../ports/RentalRepository';
import { Rental } from '../../../domain/rental/Rental';
import { NotFoundError } from '../../../core/errors';

/**
 * Use case: Get a rental by ID
 */
export class GetRentalByIdUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(rentalId: string): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new NotFoundError('Rental');
    }
    return rental;
  }
}
