import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../../infrastructure/database/prismaClient';
import { NotFoundError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class AddCarImageUseCase {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async execute(carId: number, imageUrl: string, isPrimary: boolean = false) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId, deletedAt: null },
    });
    if (!car) {
      throw new NotFoundError('Car');
    }

    if (isPrimary) {
      await this.prisma.carImage.updateMany({
        where: { carId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const carImage = await this.prisma.carImage.create({
      data: {
        carId,
        imageUrl,
        isPrimary,
      },
    });

    logger.info(`Image added to car ${carId}: ${imageUrl}`);
    return carImage;
  }
}