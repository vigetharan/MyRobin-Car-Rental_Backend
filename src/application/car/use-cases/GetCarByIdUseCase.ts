import { CarRepository } from '../ports/CarRepository';
import { NotFoundError } from '../../../domain/errors/AppError';
import { Car } from '../../../domain/car/Car';

export class GetCarByIdUseCase {
  constructor(private readonly carRepository: CarRepository) {}

  async execute(id: number): Promise<Car> {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new NotFoundError('Car');
    }
    return car;
  }
}