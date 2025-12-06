import { RentalRepository } from '../ports/RentalRepository';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { Rental } from '../../../domain/rental/Rental';
import { NotFoundError, ConflictError, AuthorizationError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class CancelRentalUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(rentalId: number, userId: number, userRole: string): Promise<Rental> {
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
    logger.info(`Rental cancelled: ID ${rentalId} by User ${userId}`);
    return updatedRental;
  }
}
