import bcrypt from 'bcryptjs';
import { UserRepository } from '../ports/UserRepository';
import { UserRole } from '../../../domain/enums/UserRole';
import { ConflictError } from '../../../domain/errors/AppError';
import { generateAccessToken, generateRefreshToken } from '../../../infrastructure/security/jwtService';
import { logger } from '../../../infrastructure/logging/logger';

export interface CreateAdminInput {
  email: string;
  password: string;
  name: string;
  drivingLicenceNumber?: string;
}

export class CreateAdminUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateAdminInput) {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: UserRole.ADMIN,
      drivingLicenceNumber: input.drivingLicenceNumber,
    });

    const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role as string });
    const refreshToken = generateRefreshToken(user.id);

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    logger.info(`Admin user created: ${user.email}`);

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
      },
    };
  }
}
