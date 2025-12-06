import { RentalRepository } from '../ports/RentalRepository';
import { UserRepository } from '../../auth/ports/UserRepository';
import { CarRepository } from '../../car/ports/CarRepository';
import { RentalStatus } from '../../../domain/enums/RentalStatus';
import { Rental } from '../../../domain/rental/Rental';
import { NotFoundError, ConflictError, ValidationError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export interface CreateRentalInput {
  carId: number;
  startDate: Date;
  endDate: Date;
  drivingLicenceNumber?: string;
  additionalInfo?: string;
}

export class CreateRentalUseCase {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly userRepository: UserRepository,
    private readonly carRepository: CarRepository,
  ) {}

  async execute(userId: number, input: CreateRentalInput): Promise<Rental> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const finalDrivingLicence = input.drivingLicenceNumber?.trim() || user.drivingLicenceNumber;
    
    // All users (including admins) must have a valid driving licence to book
    if (!finalDrivingLicence || finalDrivingLicence.trim().length < 5) {
      throw new ValidationError(
        'Driving licence number is required to rent a car. Please provide your driving licence number.',
      );
    }

    if (input.drivingLicenceNumber && !user.drivingLicenceNumber) {
      const newRole = user.role === 'GUEST' ? 'USER' : undefined;
      await this.userRepository.updateDrivingLicence(userId, input.drivingLicenceNumber.trim(), newRole);
      if (newRole) {
        logger.info(`User ${userId} upgraded from GUEST to USER`);
      }
      logger.info(`Driving licence added to user profile: User ${userId}`);
    }

    const userOverlapping = await this.rentalRepository.findUserOverlapping(
      userId,
      input.startDate,
      input.endDate,
    );
    if (userOverlapping) {
      throw new ConflictError('You already have an active rental for the selected dates');
    }

    const car = await this.carRepository.findById(input.carId);
    if (!car || !car.available) {
      throw new NotFoundError('Car not available');
    }

    const overlapping = await this.rentalRepository.findOverlapping(
      input.carId,
      input.startDate,
      input.endDate,
    );
    if (overlapping) {
      throw new ConflictError('Car already rented for the selected dates');
    }

    const days =
      Math.ceil((input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = days * car.pricePerDay;

    const rental = await this.rentalRepository.create({
      userId,
      carId: input.carId,
      startDate: input.startDate,
      endDate: input.endDate,
      totalPrice,
      status: RentalStatus.ACTIVE,
    });

    logger.info(`Rental created: User ${userId} rented Car ${input.carId}`);
    return rental;
  }
}
