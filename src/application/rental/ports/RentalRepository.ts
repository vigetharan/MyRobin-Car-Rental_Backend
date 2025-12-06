import { Rental } from '../../../domain/rental/Rental';
import { RentalStatus } from '../../../domain/enums/RentalStatus';

export interface CreateRentalData {
  userId: number;
  carId: number;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: RentalStatus;
}

export interface RentalRepository {
  create(data: CreateRentalData): Promise<Rental>;
  findById(id: number): Promise<Rental | null>;
  findByUserId(userId: number): Promise<Rental[]>;
  findActiveByUserId(userId: number): Promise<Rental[]>;
  findByCarId(carId: number): Promise<Rental[]>;
  findOverlapping(carId: number, startDate: Date, endDate: Date): Promise<Rental | null>;
  findUserOverlapping(userId: number, startDate: Date, endDate: Date): Promise<Rental | null>;
  updateStatus(id: number, status: RentalStatus): Promise<Rental>;
  getUnavailableDates(carId: number): Promise<{ startDate: Date; endDate: Date }[]>;
}
