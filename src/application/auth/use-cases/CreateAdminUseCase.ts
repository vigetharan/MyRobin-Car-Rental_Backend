import { UserRepository } from '../ports/UserRepository';
import { TokenService } from '../ports/TokenService';
import { PasswordHasher } from '../ports/PasswordHasher';
import { UserRole } from '../../../domain/enums/UserRole';
import { ConflictError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

export interface CreateAdminInput {
  email: string;
  password: string;
  name: string;
  drivingLicenceNumber?: string;
}

/**
 * Use case: Create admin user
 */
export class CreateAdminUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordHasher: PasswordHasher,
    private readonly logger?: Logger
  ) {}

  async execute(input: CreateAdminInput) {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);

    const user = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: UserRole.ADMIN,
      drivingLicenceNumber: input.drivingLicenceNumber,
    });

    const token = this.tokenService.generateAccessToken({ userId: user.id, email: user.email, role: user.role as string });
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    this.logger?.info(`Admin user created: ${user.email}`);

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
