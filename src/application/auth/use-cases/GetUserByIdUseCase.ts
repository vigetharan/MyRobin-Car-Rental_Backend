import { UserRepository } from '../ports/UserRepository';
import { NotFoundError } from '../../../domain/errors/AppError';

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number) {
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
