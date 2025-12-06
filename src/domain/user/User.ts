import { UserRole } from '../enums/UserRole';

/**
 * User domain entity
 */
export interface User {
  id: string; // UUID for security (non-predictable)
  email: string;
  name: string;
  password: string;
  role: UserRole;
  imageUrl: string | null;
  drivingLicenceNumber: string | null;
  refreshToken: string | null; // Stored as hash for security
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authenticated user context (used in requests)
 */
export interface AuthenticatedUser {
  id: string; // UUID
  email: string;
  name: string;
  role: string;
}
