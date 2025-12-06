import { CarRepository, CarFilters, PaginatedCars } from '../ports/CarRepository';

export class ListCarsUseCase {
  constructor(private readonly carRepository: CarRepository) {}

  async execute(
    page: number = 1,
    limit: number = 10,
    filters?: CarFilters,
  ): Promise<PaginatedCars> {
    return this.carRepository.list(page, limit, filters);
  }
}