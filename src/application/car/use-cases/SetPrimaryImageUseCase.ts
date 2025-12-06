import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../../infrastructure/database/prismaClient';
import { NotFoundError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class SetPrimaryImageUseCase {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async execute(imageId: number) {
    const image = await this.prisma.carImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundError('Car image');
    }

    await this.prisma.carImage.updateMany({
      where: { carId: image.carId, isPrimary: true },
      data: { isPrimary: false },
    });

    const updatedImage = await this.prisma.carImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    logger.info(`Primary image set for car ${image.carId}: ${image.imageUrl} (ID: ${imageId})`);
    return updatedImage;
  }
}