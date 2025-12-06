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

export interface CarRepository {
  create(data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car>;
  findById(id: number): Promise<Car | null>;
  list(page: number, limit: number, filters?: CarFilters): Promise<PaginatedCars>;
  update(id: number, data: Partial<Omit<Car, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Car>;
  softDelete(id: number): Promise<void>;
}
