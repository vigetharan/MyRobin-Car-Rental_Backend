import { CarImage } from '../../../domain/car/CarImage';
import { NotFoundError } from '../../../core/errors';
import { CarRepository } from '../ports/CarRepository';
import { CarImageRepository } from '../ports/CarImageRepository';

/**
 * Use case: Get all images for a car
 */
export class GetCarImagesUseCase {
  constructor(
    private readonly carRepository: CarRepository,
    private readonly carImageRepository: CarImageRepository
  ) {}

  async execute(carId: string): Promise<CarImage[]> {
    const car = await this.carRepository.findById(carId);
    if (!car) {
      throw new NotFoundError('Car');
    }

    return this.carImageRepository.findByCarId(carId);
  }
}