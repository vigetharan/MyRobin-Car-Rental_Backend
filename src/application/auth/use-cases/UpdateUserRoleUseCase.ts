import { UserRepository } from '../ports/UserRepository';
import { NotFoundError } from '../../../domain/errors/AppError';
import { logger } from '../../../infrastructure/logging/logger';

export class UpdateUserRoleUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number, role: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await this.userRepository.updateRole(userId, role);
    logger.info(`User role updated: ${updatedUser.email} -> ${role}`);

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
