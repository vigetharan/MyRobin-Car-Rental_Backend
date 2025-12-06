import { UserRepository } from '../ports/UserRepository';
import { logger } from '../../../infrastructure/logging/logger';

export class LogoutUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, null);
    logger.info(`User logged out: ${userId}`);
  }
}
