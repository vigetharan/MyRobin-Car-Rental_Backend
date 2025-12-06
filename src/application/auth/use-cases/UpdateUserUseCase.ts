import { UserRepository } from '../ports/UserRepository';
import { NotFoundError } from '../../../core/errors';

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  info(message: string): void;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  imageUrl?: string;
  drivingLicenceNumber?: string;
}

/**
 * Use case: Update user profile
 */
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger?: Logger
  ) {}

  async execute(userId: string, input: UpdateUserInput) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await this.userRepository.update(userId, input);
    this.logger?.info(`User updated: ${updatedUser.email}`);

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
