import { Rental } from '../../../domain/rental/Rental';
import { RentalStatus } from '../../../domain/enums/RentalStatus';

export interface CreateRentalData {
  userId: string;
  carId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: RentalStatus;
}

export interface RentalRepository {
  create(data: CreateRentalData): Promise<Rental>;
  findById(id: string): Promise<Rental | null>;
  findAll(): Promise<Rental[]>;
  findByUserId(userId: string): Promise<Rental[]>;
  findActiveByUserId(userId: string): Promise<Rental[]>;
  findByCarId(carId: string): Promise<Rental[]>;
  findOverlapping(carId: string, startDate: Date, endDate: Date, excludeRentalId?: string): Promise<Rental | null>;
  findUserOverlapping(userId: string, startDate: Date, endDate: Date, excludeRentalId?: string): Promise<Rental | null>;
  updateStatus(id: string, status: RentalStatus): Promise<Rental>;
  updateDates(id: string, startDate: Date, endDate: Date, totalPrice: number): Promise<Rental>;
  getUnavailableDates(carId: string): Promise<{ startDate: Date; endDate: Date }[]>;
  delete(id: string): Promise<void>;
}
