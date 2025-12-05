import { PrismaClient } from '@prisma/client';
import { CreateCarInput, UpdateCarInput, PaginatedResponse } from '../types/inputs';
import { NotFoundError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';

export class CarService {
  constructor(private prisma: PrismaClient) {}

  async createCar(data: CreateCarInput) {
    const car = await this.prisma.car.create({ data });
    logger.info(`Car created: ${car.make} ${car.model} (ID: ${car.id})`);
    return car;
  }

  async getAllCars(
    page: number = 1,
    limit: number = 10,
    filters?: {
      make?: string;
      available?: boolean;
      minPrice?: number;
      maxPrice?: number;
    }
  ): Promise<PaginatedResponse<any>> {
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
      data: cars,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCarById(id: number) {
    const car = await this.prisma.car.findUnique({
      where: { id, deletedAt: null },
      include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } },
    });
    if (!car) {
      throw new NotFoundError('Car');
    }
    return car;
  }

  async updateCar(id: number, data: UpdateCarInput) {
    const existingCar = await this.prisma.car.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existingCar) {
      throw new NotFoundError('Car');
    }
    
    const car = await this.prisma.car.update({ where: { id }, data });
    logger.info(`Car updated: ${car.make} ${car.model} (ID: ${car.id})`);
    return car;
  }

  // Soft delete
  async deleteCar(id: number) {
    const existingCar = await this.prisma.car.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existingCar) {
      throw new NotFoundError('Car');
    }

    const activeRentals = await this.prisma.rental.findMany({
      where: { carId: id, status: 'ACTIVE', deletedAt: null },
    });
    if (activeRentals.length > 0) {
      throw new ConflictError('Cannot delete car with active rentals');
    }

    await this.prisma.car.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    logger.info(`Car soft deleted: ${existingCar.make} ${existingCar.model} (ID: ${id})`);
    return 'Car deleted successfully';
  }

  async getAvailableCars(startDate: Date, endDate: Date) {
    // Note: Prisma doesn't support deletedAt in nested queries
    // We rely on status filtering and handle soft deletes at application level
    return this.prisma.car.findMany({
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
  }

  // Car Image Management
  async getCarImages(carId: number) {
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

  async addCarImage(carId: number, imageUrl: string, isPrimary: boolean = false) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId, deletedAt: null },
    });
    if (!car) {
      throw new NotFoundError('Car');
    }

    // If this is set as primary, unset other primary images
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

  async deleteCarImage(imageId: number) {
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
    return 'Image deleted successfully';
  }

  async setPrimaryImage(imageId: number) {
    const image = await this.prisma.carImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundError('Car image');
    }

    // Unset all other primary images for this car
    await this.prisma.carImage.updateMany({
      where: { carId: image.carId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set this image as primary
    const updatedImage = await this.prisma.carImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    logger.info(`Primary image set for car ${image.carId}: ${image.imageUrl} (ID: ${imageId})`);
    return updatedImage;
  }
}