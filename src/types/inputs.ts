// Enums
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum RentalStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

// User Inputs
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  drivingLicenceNumber?: string; // Optional during registration
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  imageUrl?: string;
  drivingLicenceNumber?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateRoleInput {
  role: UserRole;
}

// Car Inputs
export interface CreateCarInput {
  make: string;
  model: string;
  year: number;
  color: string;
  pricePerDay: number;
  imageUrl?: string;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  engine?: string;
  mileage?: number;
  description?: string;
}

export interface UpdateCarInput {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  pricePerDay?: number;
  imageUrl?: string;
  available?: boolean;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  engine?: string;
  mileage?: number;
  description?: string;
}

// Rental Inputs
export interface CreateRentalInput {
  carId: number;
  startDate: string;
  endDate: string;
  drivingLicenceNumber?: string; // Required if not already in profile
  additionalInfo?: string; // Additional rental information
}

export interface CreateRentalData {
  userId: number;
  carId: number;
  startDate: Date;
  endDate: Date;
}

// Pagination
export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Car Filters
export interface CarFilterInput {
  make?: string;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

// Auth Payload
export interface AuthPayload {
  token: string;
  refreshToken?: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

