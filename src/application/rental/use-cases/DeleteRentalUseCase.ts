import { RentalRepository } from '../ports/RentalRepository';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { NotFoundError, ConflictError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Delete a rental
 */
export class DeleteRentalUseCase {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly logger?: Logger
  ) {}

  async execute(rentalId: string): Promise<void> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    // Only cancelled or completed rentals can be deleted
    if (rental.status === RentalStatus.ACTIVE) {
      throw new ConflictError('Cannot delete an active rental. Cancel it first.');
    }

    await this.rentalRepository.delete(rentalId);
    this.logger?.info(`Rental deleted: ID ${rentalId}`);
  }
}
