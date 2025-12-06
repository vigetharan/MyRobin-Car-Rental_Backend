import { CarRepository } from '../ports/CarRepository';
import { Car } from '../../../domain/car/Car';
import { carUpdateValidation } from '../../../validation/schemas';
import { NotFoundError, ValidationError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

type UpdateCarInput = Partial<
  Omit<Car, 'id' | 'createdAt' | 'updatedAt'>
>;

/**
 * Use case: Update an existing car
 */
export class UpdateCarUseCase {
  constructor(
    private readonly carRepository: CarRepository,
    private readonly logger?: Logger
  ) {}

  async execute(id: string, input: UpdateCarInput): Promise<Car> {
    const { error, value } = carUpdateValidation.validate(input, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map(d => d.message).join(', '));
    }

    // Normalize optional string fields
    if (value.imageUrl === '') value.imageUrl = null;
    if (value.fuelType === '') value.fuelType = null;
    if (value.transmission === '') value.transmission = null;
    if (value.engine === '') value.engine = null;
    if (value.description === '') value.description = null;

    const existing = await this.carRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Car');
    }

    const car = await this.carRepository.update(id, value);
    this.logger?.info(`Car updated: ${car.make} ${car.model} (ID: ${car.id})`);
    return car;
  }
}