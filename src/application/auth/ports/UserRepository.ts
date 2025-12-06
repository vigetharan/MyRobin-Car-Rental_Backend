import { User } from '../../../domain/user/User';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: string;
  drivingLicenceNumber?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  imageUrl?: string;
  drivingLicenceNumber?: string;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, data: UpdateUserData): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
  updateRole(id: string, role: string): Promise<User>;
  updateRefreshToken(id: string, refreshToken: string | null): Promise<void>;
  updateDrivingLicence(id: string, drivingLicenceNumber: string, role?: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
