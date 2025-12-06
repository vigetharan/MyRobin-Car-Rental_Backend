import { Car } from '../../../domain/car/Car';
import { CarRepository } from '../ports/CarRepository';

/**
 * Use case: Get cars available for rental in a date range
 */
export class GetAvailableCarsUseCase {
  constructor(private readonly carRepository: CarRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<Car[]> {
    return this.carRepository.findAvailable(startDate, endDate);
  }
}