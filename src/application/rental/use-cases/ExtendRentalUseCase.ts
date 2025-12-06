import { RentalRepository } from '../ports/RentalRepository';
import { Rental } from '../../../domain/rental/Rental';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { NotFoundError, ConflictError, ValidationError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class ExtendRentalUseCase {
  constructor(private readonly rentalRepository: RentalRepository) {}

  async execute(rentalId: number, newEndDate: Date, pricePerDay: number): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    // Only active or pending rentals can be extended
    if (rental.status !== RentalStatus.ACTIVE && rental.status !== RentalStatus.PENDING) {
      throw new ConflictError('Only active or pending rentals can be extended');
    }

    // New end date must be after current end date
    if (newEndDate <= rental.endDate) {
      throw new ValidationError('New end date must be after current end date');
    }

    // Check for overlapping rentals in the extended period
    const overlapping = await this.rentalRepository.findOverlapping(
      rental.carId,
      rental.endDate,
      newEndDate,
      rentalId
    );

    if (overlapping) {
      throw new ConflictError('Car is not available for the extended dates');
    }

    // Calculate new total price
    const days = Math.ceil((newEndDate.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = days * pricePerDay;

    const updatedRental = await this.rentalRepository.updateDates(rentalId, rental.startDate, newEndDate, totalPrice);
    logger.info(`Rental extended: ID ${rentalId} to ${newEndDate.toISOString()}`);
    return updatedRental;
  }
}
