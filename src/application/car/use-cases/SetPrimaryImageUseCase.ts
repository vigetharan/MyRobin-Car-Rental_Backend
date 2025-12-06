import { CarImage } from '../../../domain/car/CarImage';
import { NotFoundError } from '../../../core/errors';
import { CarImageRepository } from '../ports/CarImageRepository';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Set an image as the primary image for a car
 */
export class SetPrimaryImageUseCase {
  constructor(
    private readonly carImageRepository: CarImageRepository,
    private readonly logger?: Logger
  ) {}

  async execute(imageId: string): Promise<CarImage> {
    const image = await this.carImageRepository.findById(imageId);
    if (!image) {
      throw new NotFoundError('Car image');
    }

    // Reset all other images for this car to non-primary
    await this.carImageRepository.resetPrimaryForCar(image.carId);

    // Set this image as primary
    const updatedImage = await this.carImageRepository.update(imageId, { isPrimary: true });

    this.logger?.info(`Primary image set for car ${image.carId}: ${image.imageUrl} (ID: ${imageId})`);
    return updatedImage;
  }
}