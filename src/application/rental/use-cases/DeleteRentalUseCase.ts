import { RentalRepository } from '../ports/RentalRepository';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { NotFoundError, ConflictError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class DeleteRentalUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(rentalId: number): Promise<void> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    // Only cancelled or completed rentals can be deleted
    if (rental.status === RentalStatus.ACTIVE) {
      throw new ConflictError('Cannot delete an active rental. Cancel it first.');
    }

    await this.rentalRepository.delete(rentalId);
    logger.info(`Rental deleted: ID ${rentalId}`);
  }
}
