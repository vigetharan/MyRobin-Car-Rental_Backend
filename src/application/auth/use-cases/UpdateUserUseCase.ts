import { UserRepository } from '../ports/UserRepository';
import { NotFoundError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export interface UpdateUserInput {
  email?: string;
  name?: string;
  imageUrl?: string;
  drivingLicenceNumber?: string;
}

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number, input: UpdateUserInput) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await this.userRepository.update(userId, input);
    logger.info(`User updated: ${updatedUser.email}`);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      imageUrl: updatedUser.imageUrl,
      drivingLicenceNumber: updatedUser.drivingLicenceNumber,
    };
  }
}
