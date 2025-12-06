import bcrypt from 'bcryptjs';
import { UserRepository } from '../ports/UserRepository';
import { User } from '../../../domain/user/User';
import { UserRole } from '../../../domain/enums/UserRole';
import { ConflictError } from '../../../domain/errors/AppError';
import { generateAccessToken, generateRefreshToken } from '../../../infrastructure/security/jwtService';
import { logger } from '../../../infrastructure/logging/logger';

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  drivingLicenceNumber?: string;
}

export interface AuthPayload {
  token: string;
  refreshToken: string;
  user: Omit<User, 'password' | 'refreshToken'>;
}

export class SignupUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: SignupInput): Promise<AuthPayload> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const role =
      input.drivingLicenceNumber && input.drivingLicenceNumber.trim().length >= 5
        ? UserRole.USER
        : UserRole.GUEST;

    const user = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role,
      drivingLicenceNumber: input.drivingLicenceNumber?.trim() || undefined,
    });

    const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role as string });
    const refreshToken = generateRefreshToken(user.id);

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    logger.info(`User signed up: ${user.email} with role ${role}`);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        imageUrl: user.imageUrl,
        drivingLicenceNumber: user.drivingLicenceNumber,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
