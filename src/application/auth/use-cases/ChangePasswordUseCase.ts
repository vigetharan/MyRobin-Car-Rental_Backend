import { UserRepository } from '../ports/UserRepository';
import { PasswordHasher } from '../ports/PasswordHasher';
import { NotFoundError, AuthenticationError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Change user password
 */
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly logger?: Logger
  ) {}

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await this.passwordHasher.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const hashedPassword = await this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePassword(userId, hashedPassword);

    this.logger?.info(`Password changed for user: ${user.email}`);
    return 'Password changed successfully';
  }
}
