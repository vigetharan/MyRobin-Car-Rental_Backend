import { PrismaClient } from '@prisma/client';
import { AuthenticatedUser } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { CarService } from '../services/carService';
import { RentalService } from '../services/rentalService';

export interface Services {
  auth: AuthService;
  car: CarService;
  rental: RentalService;
}

export interface Context {
  prisma: PrismaClient;
  user: AuthenticatedUser | null;
  services?: Services; // Optional for backward compatibility
}