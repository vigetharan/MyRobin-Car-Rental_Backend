/**
 * Car domain entity
 */
export interface Car {
  id: string; // UUID for security (non-predictable)
  make: string;
  model: string;
  year: number;
  color: string;
  pricePerDay: number;
  available: boolean;
  imageUrl: string | null;
  fuelType: string | null;
  transmission: string | null;
  seats: number | null;
  engine: string | null;
  mileage: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
