import { UserRepository } from '../ports/UserRepository';
import { NotFoundError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

/**
 * Use case: Update user role
 */
export class UpdateUserRoleUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger?: Logger
  ) {}

  async execute(userId: string, role: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await this.userRepository.updateRole(userId, role);
    this.logger?.info(`User role updated: ${updatedUser.email} -> ${role}`);

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
