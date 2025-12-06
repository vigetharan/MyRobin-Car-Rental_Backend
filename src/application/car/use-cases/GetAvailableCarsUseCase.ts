import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../../infrastructure/database/prismaClient';
import { Car } from '../../../domain/car/Car';

export class GetAvailableCarsUseCase {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async execute(startDate: Date, endDate: Date): Promise<Car[]> {
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
}