import { UserRole } from '../enums/UserRole';

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  imageUrl: string | null;
  drivingLicenceNumber: string | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
}
