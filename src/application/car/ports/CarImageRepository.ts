import { CarImage } from '../../../domain/car/CarImage';

/**
 * Port for car image persistence operations
 */
export interface CarImageRepository {
  /**
   * Find all images for a car, ordered by isPrimary desc, createdAt asc
   */
  findByCarId(carId: string): Promise<CarImage[]>;

  /**
   * Find a single image by ID
   */
  findById(id: string): Promise<CarImage | null>;

  /**
   * Create a new car image
   */
  create(data: { carId: string; imageUrl: string; isPrimary: boolean }): Promise<CarImage>;

  /**
   * Update an image
   */
  update(id: string, data: Partial<Pick<CarImage, 'isPrimary'>>): Promise<CarImage>;

  /**
   * Delete an image
   */
  delete(id: string): Promise<void>;

  /**
   * Reset all images for a car to non-primary
   */
  resetPrimaryForCar(carId: string): Promise<void>;
}
