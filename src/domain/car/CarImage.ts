/**
 * CarImage domain entity
 */
export interface CarImage {
  id: string; // UUID for security (non-predictable)
  carId: string;
  imageUrl: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}
