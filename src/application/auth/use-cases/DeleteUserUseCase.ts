import { UserRepository } from '../ports/UserRepository';
import { NotFoundError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await this.userRepository.softDelete(userId);
    logger.info(`User deleted: ${user.email}`);
    return 'User deleted successfully';
  }
}
