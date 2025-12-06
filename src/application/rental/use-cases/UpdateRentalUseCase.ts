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

interface UpdateRentalInput {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Use case: Update rental dates
 */
export class UpdateRentalUseCase {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly logger?: Logger
  ) {}

  async execute(rentalId: string, input: UpdateRentalInput, carPricePerDay: number): Promise<Rental> {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    // Only pending rentals can be updated
    if (rental.status !== RentalStatus.PENDING) {
      throw new ConflictError('Only pending rentals can be updated');
    }

    const newStartDate = input.startDate || rental.startDate;
    const newEndDate = input.endDate || rental.endDate;

    // Validate dates
    if (newStartDate >= newEndDate) {
      throw new ValidationError('End date must be after start date');
    }

    if (newStartDate < new Date()) {
      throw new ValidationError('Start date cannot be in the past');
    }

    // Check for overlapping rentals (excluding current rental)
    const overlapping = await this.rentalRepository.findOverlapping(
      rental.carId,
      newStartDate,
      newEndDate,
      rentalId
    );

    if (overlapping) {
      throw new ConflictError('Car is not available for the selected dates');
    }

    // Calculate new total price
    const days = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = days * carPricePerDay;

    const updatedRental = await this.rentalRepository.updateDates(rentalId, newStartDate, newEndDate, totalPrice);
    this.logger?.info(`Rental updated: ID ${rentalId}`);
    return updatedRental;
  }
}
