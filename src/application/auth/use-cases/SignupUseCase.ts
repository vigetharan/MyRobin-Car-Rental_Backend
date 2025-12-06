import { UserRepository } from '../ports/UserRepository';
import { TokenService } from '../ports/TokenService';
import { PasswordHasher } from '../ports/PasswordHasher';
import { User } from '../../../domain/user/User';
import { UserRole } from '../../../domain/enums/UserRole';
import { ConflictError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

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

/**
 * Use case: User signup
 */
export class SignupUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordHasher: PasswordHasher,
    private readonly logger?: Logger
  ) {}

  async execute(input: SignupInput): Promise<AuthPayload> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);

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

    const token = this.tokenService.generateAccessToken({ userId: user.id, email: user.email, role: user.role as string });
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    this.logger?.info(`User signed up: ${user.email} with role ${role}`);

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
