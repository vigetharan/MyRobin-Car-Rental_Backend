import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../../infrastructure/database/prismaClient';
import { NotFoundError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class DeleteCarImageUseCase {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async execute(imageId: number): Promise<void> {
    const image = await this.prisma.carImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundError('Car image');
    }

    await this.prisma.carImage.delete({
      where: { id: imageId },
    });

    logger.info(`Image deleted: ${image.imageUrl} (ID: ${imageId})`);
  }
}