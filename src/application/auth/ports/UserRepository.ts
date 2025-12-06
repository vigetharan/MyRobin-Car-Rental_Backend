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
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: number, data: UpdateUserData): Promise<User>;
  updatePassword(id: number, hashedPassword: string): Promise<void>;
  updateRole(id: number, role: string): Promise<User>;
  updateRefreshToken(id: number, refreshToken: string | null): Promise<void>;
  updateDrivingLicence(id: number, drivingLicenceNumber: string, role?: string): Promise<void>;
  softDelete(id: number): Promise<void>;
}
