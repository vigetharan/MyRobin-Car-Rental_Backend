import bcrypt from 'bcryptjs';
import { UserRepository } from '../ports/UserRepository';
import { AuthenticationError } from '../../../domain/errors/AppError';
import { generateAccessToken, generateRefreshToken } from '../../../infrastructure/security/jwtService';
import { logger } from '../../../infrastructure/logging/logger';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    imageUrl: string | null;
    drivingLicenceNumber: string | null;
  };
}

export class LoginUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: LoginInput): Promise<AuthPayload> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) {
      logger.warn(`Failed login attempt for: ${input.email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role as string });
    const refreshToken = generateRefreshToken(user.id);

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    logger.info(`User logged in: ${user.email}`);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as string,
        imageUrl: user.imageUrl,
        drivingLicenceNumber: user.drivingLicenceNumber,
      },
    };
  }
}
