import bcrypt from 'bcryptjs';
import { UserRepository } from '../ports/UserRepository';
import { NotFoundError, AuthenticationError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class ChangePasswordUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number, currentPassword: string, newPassword: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.updatePassword(userId, hashedPassword);

    logger.info(`Password changed for user: ${user.email}`);
    return 'Password changed successfully';
  }
}
