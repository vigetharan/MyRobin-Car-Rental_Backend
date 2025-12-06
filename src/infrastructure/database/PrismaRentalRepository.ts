import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient';
import { Rental } from '../../domain/rental/Rental';
import { RentalStatus } from '../../domain/enums/RentalStatus';
import { RentalRepository, CreateRentalData } from '../../application/rental/ports/RentalRepository';

export class PrismaRentalRepository implements RentalRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async create(data: CreateRentalData): Promise<Rental> {
    const rental = await this.prisma.rental.create({
      data,
      include: { car: true, user: true },
    });
    return rental as unknown as Rental;
  }

  async findById(id: number): Promise<Rental | null> {
    const rental = await this.prisma.rental.findFirst({
      where: { id },
      include: { car: true, user: true },
    });
    return rental as unknown as Rental | null;
  }

  async findAll(): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      include: { car: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
    return rentals as unknown as Rental[];
  }

  async findByUserId(userId: number): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: { userId },
      include: { car: true },
      orderBy: { createdAt: 'desc' },
    });
    return rentals as unknown as Rental[];
  }

  async findActiveByUserId(userId: number): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        userId,
        status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] },
      },
      include: { car: true },
    });
    return rentals as unknown as Rental[];
  }

  async findByCarId(carId: number): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: { carId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return rentals as unknown as Rental[];
  }

  async findOverlapping(carId: number, startDate: Date, endDate: Date, excludeRentalId?: number): Promise<Rental | null> {
    const rental = await this.prisma.rental.findFirst({
      where: {
        carId,
        OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
        status: { not: RentalStatus.CANCELLED },
        ...(excludeRentalId && { id: { not: excludeRentalId } }),
      },
    });
    return rental as unknown as Rental | null;
  }

  async findUserOverlapping(userId: number, startDate: Date, endDate: Date, excludeRentalId?: number): Promise<Rental | null> {
    const rental = await this.prisma.rental.findFirst({
      where: {
        userId,
        OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
        status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] },
        ...(excludeRentalId && { id: { not: excludeRentalId } }),
      },
    });
    return rental as unknown as Rental | null;
  }

  async updateStatus(id: number, status: RentalStatus): Promise<Rental> {
    const rental = await this.prisma.rental.update({
      where: { id },
      data: { status },
      include: { car: true, user: true },
    });
    return rental as unknown as Rental;
  }

  async updateDates(id: number, startDate: Date, endDate: Date, totalPrice: number): Promise<Rental> {
    const rental = await this.prisma.rental.update({
      where: { id },
      data: { startDate, endDate, totalPrice },
      include: { car: true, user: true },
    });
    return rental as unknown as Rental;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.rental.delete({ where: { id } });
  }

  async getUnavailableDates(carId: number): Promise<{ startDate: Date; endDate: Date }[]> {
    const rentals = await this.prisma.rental.findMany({
      where: {
        carId,
        status: { in: [RentalStatus.PENDING, RentalStatus.ACTIVE] },
      },
      select: { startDate: true, endDate: true },
    });
    return rentals;
  }
}
