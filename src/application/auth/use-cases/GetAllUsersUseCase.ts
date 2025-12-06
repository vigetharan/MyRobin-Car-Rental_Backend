import { UserRepository } from '../ports/UserRepository';

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute() {
    const users = await this.userRepository.findAll();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      imageUrl: user.imageUrl,
      drivingLicenceNumber: user.drivingLicenceNumber,
    }));
  }
}
