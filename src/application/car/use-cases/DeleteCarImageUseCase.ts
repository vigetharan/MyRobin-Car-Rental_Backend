import { NotFoundError } from '../../../core/errors';
import { CarImageRepository } from '../ports/CarImageRepository';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Delete a car image
 */
export class DeleteCarImageUseCase {
  constructor(
    private readonly carImageRepository: CarImageRepository,
    private readonly logger?: Logger
  ) {}

  async execute(imageId: string): Promise<void> {
    const image = await this.carImageRepository.findById(imageId);
    if (!image) {
      throw new NotFoundError('Car image');
    }

    await this.carImageRepository.delete(imageId);

    this.logger?.info(`Image deleted: ${image.imageUrl} (ID: ${imageId})`);
  }
}