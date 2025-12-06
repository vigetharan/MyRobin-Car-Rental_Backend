import { RentalRepository } from '../ports/RentalRepository';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { Rental } from '../../../domain/rental/Rental';
import { NotFoundError, ConflictError, AuthorizationError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Cancel a rental
 */
export class CancelRentalUseCase {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly logger?: Logger
  ) {}

  async execute(rentalId: string, userId: string, userRole: string): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    if (rental.userId !== userId && userRole !== 'ADMIN') {
      throw new AuthorizationError('Not authorized to cancel this rental');
    }

    if (rental.status === RentalStatus.CANCELLED) {
      throw new ConflictError('Rental is already cancelled');
    }

    const updatedRental = await this.rentalRepository.updateStatus(rentalId, RentalStatus.CANCELLED);
    this.logger?.info(`Rental cancelled: ID ${rentalId} by User ${userId}`);
    return updatedRental;
  }
}
