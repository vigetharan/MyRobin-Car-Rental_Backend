import { Car } from '../../../domain/car/Car';

export interface CarFilters {
  make?: string;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedCars {
  data: Car[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Port for car persistence operations
 */
export interface CarRepository {
  create(data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car>;
  findById(id: string): Promise<Car | null>;
  list(page: number, limit: number, filters?: CarFilters): Promise<PaginatedCars>;
  update(id: string, data: Partial<Omit<Car, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Car>;
  softDelete(id: string): Promise<void>;

  /**
   * Find cars available for rental in a given date range
   * (no overlapping PENDING/ACTIVE rentals)
   */
  findAvailable(startDate: Date, endDate: Date): Promise<Car[]>;

  /**
   * Check if a car has any active rentals
   */
  hasActiveRentals(carId: string): Promise<boolean>;
}
