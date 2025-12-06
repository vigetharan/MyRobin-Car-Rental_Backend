import { RentalRepository } from '../ports/RentalRepository';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { Rental } from '../../../domain/rental/Rental';
import { NotFoundError, ConflictError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class CompleteRentalUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(rentalId: number): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new ConflictError('Only active rentals can be completed');
    }

    const updatedRental = await this.rentalRepository.updateStatus(rentalId, RentalStatus.COMPLETED);
    logger.info(`Rental completed: ID ${rentalId}`);
    return updatedRental;
  }
}
