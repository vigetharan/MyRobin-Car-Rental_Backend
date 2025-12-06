import { CarImage } from '../../../domain/car/CarImage';
import { NotFoundError } from '../../../core/errors';
import { CarRepository } from '../ports/CarRepository';
import { CarImageRepository } from '../ports/CarImageRepository';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Add an image to a car
 */
export class AddCarImageUseCase {
  constructor(
    private readonly carRepository: CarRepository,
    private readonly carImageRepository: CarImageRepository,
    private readonly logger?: Logger
  ) {}

  async execute(carId: string, imageUrl: string, isPrimary: boolean = false): Promise<CarImage> {
    const car = await this.carRepository.findById(carId);
    if (!car) {
      throw new NotFoundError('Car');
    }

    if (isPrimary) {
      await this.carImageRepository.resetPrimaryForCar(carId);
    }

    const carImage = await this.carImageRepository.create({
      carId,
      imageUrl,
      isPrimary,
    });

    this.logger?.info(`Image added to car ${carId}: ${imageUrl}`);
    return carImage;
  }
}