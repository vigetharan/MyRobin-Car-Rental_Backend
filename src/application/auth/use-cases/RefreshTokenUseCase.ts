import { UserRepository } from '../ports/UserRepository';
import { AuthenticationError } from '../../../domain/errors/AppError';
import { verifyRefreshToken, generateAccessToken } from '../../../infrastructure/security/jwtService';

export class RefreshTokenUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      const token = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role as string,
      });

      return { token };
    } catch {
      throw new AuthenticationError('Invalid refresh token');
    }
  }
}
