import { RentalRepository } from '../ports/RentalRepository';
import { Rental } from '../../../domain/rental/Rental';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { NotFoundError, ConflictError, ValidationError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Extend a rental's end date
 */
export class ExtendRentalUseCase {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly logger?: Logger
  ) {}

  async execute(rentalId: string, newEndDate: Date, pricePerDay: number): Promise<Rental> {
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
    this.logger?.info(`Rental extended: ID ${rentalId} to ${newEndDate.toISOString()}`);
    return updatedRental;
  }
}
