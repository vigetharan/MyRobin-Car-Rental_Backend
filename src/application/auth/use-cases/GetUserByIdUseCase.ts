import { UserRepository } from '../ports/UserRepository';
import { NotFoundError } from '../../../core/errors';

/**
 * Use case: Get user by ID
 */
export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      imageUrl: user.imageUrl,
      drivingLicenceNumber: user.drivingLicenceNumber,
    };
  }
}
