import { CarRepository } from '../ports/CarRepository';
import { NotFoundError, ConflictError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Soft delete a car
 */
export class DeleteCarUseCase {
  constructor(
    private readonly carRepository: CarRepository,
    private readonly logger?: Logger
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.carRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Car');
    }

    const hasActiveRentals = await this.carRepository.hasActiveRentals(id);
    if (hasActiveRentals) {
      throw new ConflictError('Cannot delete car with active rentals');
    }

    await this.carRepository.softDelete(id);
    this.logger?.info(`Car soft deleted: ${existing.make} ${existing.model} (ID: ${id})`);
  }
}