import { CarRepository } from '../ports/CarRepository';
import { NotFoundError, ConflictError } from '../../../domain/errors/AppError';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../../infrastructure/database/prismaClient';
import { logger } from '../../../infrastructure/logging/logger';

export class DeleteCarUseCase {
  private prisma: PrismaClient;

  constructor(private readonly carRepository: CarRepository, prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async execute(id: number): Promise<void> {
    const existing = await this.carRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Car');
    }

    const activeRentals = await this.prisma.rental.findMany({
      where: { carId: id, status: 'ACTIVE', deletedAt: null },
    });

    if (activeRentals.length > 0) {
      throw new ConflictError('Cannot delete car with active rentals');
    }

    await this.carRepository.softDelete(id);
    logger.info(`Car soft deleted: ${existing.make} ${existing.model} (ID: ${id})`);
  }
}