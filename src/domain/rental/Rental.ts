import { RentalStatus } from '../enums/RentalStatus';

export interface Rental {
  id: number;
  userId: number;
  carId: number;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: RentalStatus;
  createdAt: Date;
  updatedAt: Date;
}
