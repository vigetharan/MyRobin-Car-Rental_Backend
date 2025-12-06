import { CarRepository } from '../ports/CarRepository';
import { Car } from '../../../domain/car/Car';
import { carValidation } from '../../../validation/schemas';
import { ValidationError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

type CreateCarInput = Omit<
  Car,
  'id' | 'createdAt' | 'updatedAt' | 'available'
> & { available?: boolean };

/**
 * Use case: Create a new car
 */
export class CreateCarUseCase {
  constructor(
    private readonly carRepository: CarRepository,
    private readonly logger?: Logger
  ) {}

  async execute(input: CreateCarInput): Promise<Car> {
    const { error, value } = carValidation.validate(input, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map(d => d.message).join(', '));
    }

    // Normalize optional string fields
    if (value.imageUrl === '') value.imageUrl = null;
    if (value.fuelType === '') value.fuelType = null;
    if (value.transmission === '') value.transmission = null;
    if (value.engine === '') value.engine = null;
    if (value.description === '') value.description = null;

    const car = await this.carRepository.create(value);
    this.logger?.info(`Car created: ${car.make} ${car.model} (ID: ${car.id})`);
    return car;
  }
}