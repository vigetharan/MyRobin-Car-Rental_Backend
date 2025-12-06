import { RentalStatus } from '../enums/RentalStatus';

/**
 * Rental domain entity
 */
export interface Rental {
  id: string; // UUID for security (non-predictable)
  userId: string;
  carId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: RentalStatus;
  createdAt: Date;
  updatedAt: Date;
}
