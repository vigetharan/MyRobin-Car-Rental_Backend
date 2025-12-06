import { UserRepository } from '../ports/UserRepository';
import { AuthenticationError } from '../../../domain/errors/AppError';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../../../infrastructure/security/jwtService';
import { logger } from '../../../infrastructure/logging/logger';

export interface RefreshTokenResult {
  token: string;
  refreshToken?: string; // New refresh token (rotation)
}

export class RefreshTokenUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(refreshToken: string, rotateRefreshToken: boolean = true): Promise<RefreshTokenResult> {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        logger.warn(`Invalid refresh token attempt for user: ${decoded.userId}`);
        throw new AuthenticationError('Invalid refresh token');
      }

      const token = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role as string,
      });

      const result: RefreshTokenResult = { token };

      // Rotate refresh token for security (prevents token reuse attacks)
      if (rotateRefreshToken) {
        const newRefreshToken = generateRefreshToken(user.id);
        await this.userRepository.updateRefreshToken(user.id, newRefreshToken);
        result.refreshToken = newRefreshToken;
        logger.debug(`Refresh token rotated for user: ${user.id}`);
      }

      return result;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Refresh token error:', error);
      throw new AuthenticationError('Invalid refresh token');
    }
  }
}
