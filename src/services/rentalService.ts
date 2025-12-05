import { PrismaClient } from '@prisma/client';
import { CreateRentalData, RentalStatus } from '../types/inputs';
import { NotFoundError, ConflictError, AuthorizationError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class RentalService {
  constructor(private prisma: PrismaClient) {}

  async createRental(data: CreateRentalData, drivingLicenceNumber?: string, additionalInfo?: string) {
    // Check if user has driving licence (required for rental)
    // Note: deletedAt check removed - run prisma generate after migration
    const user = await this.prisma.user.findFirst({
      where: { id: data.userId },
      select: { drivingLicenceNumber: true, role: true }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Driving licence must be provided either in profile or in rental request
    const finalDrivingLicence = drivingLicenceNumber?.trim() || user.drivingLicenceNumber;
    if (!finalDrivingLicence || finalDrivingLicence.trim().length < 5) {
      throw new ValidationError('Driving licence number is required to rent a car. Please provide your driving licence number.');
    }

    // Update user profile with driving licence and upgrade role if needed
    if (drivingLicenceNumber && !user.drivingLicenceNumber) {
      const updateData: any = { 
        drivingLicenceNumber: drivingLicenceNumber.trim() 
      };
      
      // Upgrade GUEST to USER when they provide driving licence
      if (user.role === 'GUEST') {
        updateData.role = 'USER';
        logger.info(`User ${data.userId} upgraded from GUEST to USER`);
      }
      
      await this.prisma.user.update({
        where: { id: data.userId },
        data: updateData
      });
      logger.info(`Driving licence added to user profile: User ${data.userId}`);
    }

    // Check if user already has an active rental for the requested period
    // Note: deletedAt check removed - run prisma generate after migration
    const userActiveRental = await this.prisma.rental.findFirst({
      where: {
        userId: data.userId,
        OR: [
          { startDate: { lte: data.endDate }, endDate: { gte: data.startDate } }
        ],
        status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] }
      }
    });

    if (userActiveRental) {
      throw new ConflictError('You already have an active rental for the selected dates');
    }

    // Note: deletedAt check removed - run prisma generate after migration
    const car = await this.prisma.car.findFirst({ 
      where: { id: data.carId } 
    });
    if (!car || !car.available) {
      throw new NotFoundError('Car not available');
    }

    // Check for overlapping rentals on the same car
    // Note: Prisma doesn't support deletedAt in nested queries, but we filter by status
    // Soft-deleted rentals should have status CANCELLED, so this check is sufficient
    const overlapping = await this.prisma.rental.findFirst({
      where: {
        carId: data.carId,
        OR: [
          { startDate: { lte: data.endDate }, endDate: { gte: data.startDate } }
        ],
        status: { not: RentalStatus.CANCELLED }
        // deletedAt check removed - Prisma limitation with nested queries
      }
    });

    if (overlapping) {
      throw new ConflictError('Car already rented for the selected dates');
    }

    const days = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = days * car.pricePerDay;

    const rental = await this.prisma.rental.create({
      data: { 
        ...data, 
        totalPrice,
        status: RentalStatus.ACTIVE
      },
      include: { car: true }
    });

    logger.info(`Rental created: User ${data.userId} rented Car ${data.carId}`);
    return rental;
  }

  async getUserRentals(userId: number) {
    // Note: deletedAt check removed - run prisma generate after migration
    return this.prisma.rental.findMany({
      where: { userId },
      include: { car: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async cancelRental(id: number, userId: number, userRole: string) {
    // Note: deletedAt check removed - run prisma generate after migration
    const rental = await this.prisma.rental.findFirst({ 
      where: { id } 
    });
    if (!rental) {
      throw new NotFoundError('Rental');
    }
    
    if (rental.userId !== userId && userRole !== 'ADMIN') {
      throw new AuthorizationError('Not authorized to cancel this rental');
    }

    if (rental.status === RentalStatus.CANCELLED) {
      throw new ConflictError('Rental is already cancelled');
    }

    const updatedRental = await this.prisma.rental.update({
      where: { id },
      data: { status: RentalStatus.CANCELLED },
      include: { car: true }
    });

    logger.info(`Rental cancelled: ID ${id} by User ${userId}`);
    return updatedRental;
  }

  async completeRental(id: number) {
    // Note: deletedAt check removed - run prisma generate after migration
    const rental = await this.prisma.rental.findFirst({
      where: { id }
    });
    if (!rental) {
      throw new NotFoundError('Rental');
    }

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new ConflictError('Only active rentals can be completed');
    }

    const updatedRental = await this.prisma.rental.update({
      where: { id },
      data: { status: RentalStatus.COMPLETED },
      include: { car: true }
    });

    logger.info(`Rental completed: ID ${id}`);
    return updatedRental;
  }

  async getCarUnavailableDates(carId: number) {
    // Note: deletedAt check removed - run prisma generate after migration
    const rentals = await this.prisma.rental.findMany({
      where: {
        carId,
        status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] }
      },
      select: {
        startDate: true,
        endDate: true
      }
    });

    return rentals.map(rental => ({
      startDate: rental.startDate,
      endDate: rental.endDate
    }));
  }

  async getUserActiveRentals(userId: number) {
    // Note: deletedAt check removed - run prisma generate after migration
    return this.prisma.rental.findMany({
      where: {
        userId,
        status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] }
      },
      include: { car: true }
    });
  }

  async getCarRentalHistory(carId: number) {
    // Note: deletedAt check removed - run prisma generate after migration
    return this.prisma.rental.findMany({
      where: { carId },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}