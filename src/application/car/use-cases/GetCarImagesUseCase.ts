import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../../infrastructure/database/prismaClient';
import { NotFoundError } from '../../../domain/errors/AppError';

export class GetCarImagesUseCase {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async execute(carId: number) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId, deletedAt: null },
    });
    if (!car) {
      throw new NotFoundError('Car');
    }

    return this.prisma.carImage.findMany({
      where: { carId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }
}