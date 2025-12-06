import { RentalRepository } from '../ports/RentalRepository';
import { Rental } from '../../../domain/rental/Rental';
import { NotFoundError } from '../../../domain/errors/AppError';

export class GetRentalByIdUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(id: number): Promise<Rental> {
    const rental = await this.rentalRepository.findById(id);
    if (!rental) {
      throw new NotFoundError('Rental');
    }
    return rental;
  }
}
