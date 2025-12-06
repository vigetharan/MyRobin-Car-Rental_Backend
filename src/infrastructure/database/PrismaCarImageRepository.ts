import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient';
import { CarImage } from '../../domain/car/CarImage';
import { CarImageRepository } from '../../application/car/ports/CarImageRepository';

/**
 * Prisma implementation of CarImageRepository port
 */
export class PrismaCarImageRepository implements CarImageRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? getPrismaClient();
  }

  async findByCarId(carId: string): Promise<CarImage[]> {
    const images = await this.prisma.carImage.findMany({
      where: { carId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    return images as unknown as CarImage[];
  }

  async findById(id: string): Promise<CarImage | null> {
    const image = await this.prisma.carImage.findUnique({
      where: { id },
    });
    return image as unknown as CarImage | null;
  }

  async create(data: { carId: string; imageUrl: string; isPrimary: boolean }): Promise<CarImage> {
    const image = await this.prisma.carImage.create({
      data,
    });
    return image as unknown as CarImage;
  }

  async update(id: string, data: Partial<Pick<CarImage, 'isPrimary'>>): Promise<CarImage> {
    const image = await this.prisma.carImage.update({
      where: { id },
      data,
    });
    return image as unknown as CarImage;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.carImage.delete({
      where: { id },
    });
  }

  async resetPrimaryForCar(carId: string): Promise<void> {
    await this.prisma.carImage.updateMany({
      where: { carId, isPrimary: true },
      data: { isPrimary: false },
    });
  }
}
