import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient';
import { Car } from '../../domain/car/Car';
import { CarRepository, CarFilters, PaginatedCars } from '../../application/car/ports/CarRepository';

/**
 * Prisma implementation of CarRepository port
 */
export class PrismaCarRepository implements CarRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async create(data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car> {
    const car = await this.prisma.car.create({ data });
    return car as unknown as Car;
  }

  async findById(id: string): Promise<Car | null> {
    const car = await this.prisma.car.findUnique({
      where: { id, deletedAt: null },
      include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } },
    });
    return car as unknown as Car | null;
  }

  async list(page: number, limit: number, filters?: CarFilters): Promise<PaginatedCars> {
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (filters?.make) {
      where.make = { contains: filters.make };
    }
    if (filters?.available !== undefined) {
      where.available = filters.available;
    }
    if (filters?.minPrice !== undefined) {
      where.pricePerDay = { ...where.pricePerDay, gte: filters.minPrice };
    }
    if (filters?.maxPrice !== undefined) {
      where.pricePerDay = { ...where.pricePerDay, lte: filters.maxPrice };
    }

    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } },
      }),
      this.prisma.car.count({ where }),
    ]);

    return {
      data: cars as unknown as Car[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: Partial<Omit<Car, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Car> {
    const car = await this.prisma.car.update({ where: { id }, data });
    return car as unknown as Car;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findAvailable(startDate: Date, endDate: Date): Promise<Car[]> {
    const cars = await this.prisma.car.findMany({
      where: {
        deletedAt: null,
        available: true,
        rentals: {
          none: {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
              { status: { in: ['PENDING', 'ACTIVE'] } },
            ],
          },
        },
      },
      include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } },
    });

    return cars as unknown as Car[];
  }

  async hasActiveRentals(carId: string): Promise<boolean> {
    const count = await this.prisma.rental.count({
      where: {
        carId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    return count > 0;
  }
}
