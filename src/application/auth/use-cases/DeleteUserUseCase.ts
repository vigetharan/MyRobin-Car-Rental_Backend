import { UserRepository } from '../ports/UserRepository';
import { NotFoundError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Delete a user
 */
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger?: Logger
  ) {}

  async execute(userId: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await this.userRepository.softDelete(userId);
    this.logger?.info(`User deleted: ${user.email}`);
    return 'User deleted successfully';
  }
}
