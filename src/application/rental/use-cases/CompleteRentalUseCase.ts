import { RentalRepository } from '../ports/RentalRepository';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { Rental } from '../../../domain/rental/Rental';
import { NotFoundError, ConflictError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Complete a rental
 */
export class CompleteRentalUseCase {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly logger?: Logger
  ) {}

  async execute(rentalId: string): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new ConflictError('Only active rentals can be completed');
    }

    const updatedRental = await this.rentalRepository.updateStatus(rentalId, RentalStatus.COMPLETED);
    this.logger?.info(`Rental completed: ID ${rentalId}`);
    return updatedRental;
  }
}
