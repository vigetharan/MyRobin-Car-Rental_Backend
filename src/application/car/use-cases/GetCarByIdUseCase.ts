import { CarRepository } from '../ports/CarRepository';
import { NotFoundError } from '../../../core/errors';
import { Car } from '../../../domain/car/Car';

/**
 * Use case: Get a car by ID
 */
export class GetCarByIdUseCase {
  constructor(private readonly carRepository: CarRepository) {}

  async execute(id: string): Promise<Car> {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new NotFoundError('Car');
    }
    return car;
  }
}