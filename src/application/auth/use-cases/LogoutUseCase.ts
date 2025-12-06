import { UserRepository } from '../ports/UserRepository';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: User logout
 */
export class LogoutUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger?: Logger
  ) {}

  async execute(userId: string): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, null);
    this.logger?.info(`User logged out: ${userId}`);
  }
}
