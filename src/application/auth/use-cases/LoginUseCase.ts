import { UserRepository } from '../ports/UserRepository';
import { TokenService } from '../ports/TokenService';
import { PasswordHasher } from '../ports/PasswordHasher';
import { AuthenticationError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
  warn(message: string): void;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  refreshToken: string;
  user: {
    id: string; // UUID
    email: string;
    name: string;
    role: string;
    imageUrl: string | null;
    drivingLicenceNumber: string | null;
  };
}

/**
 * Use case: User login
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordHasher: PasswordHasher,
    private readonly logger?: Logger
  ) {}

  async execute(input: LoginInput): Promise<AuthPayload> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await this.passwordHasher.compare(input.password, user.password);
    if (!isValid) {
      this.logger?.warn(`Failed login attempt for: ${input.email}`);
      throw new AuthenticationError('Invalid credentials');
    }

    const token = this.tokenService.generateAccessToken({ userId: user.id, email: user.email, role: user.role as string });
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    this.logger?.info(`User logged in: ${user.email}`);

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
