import { getPrismaClient } from '../database/prismaClient';
import { verifyAccessToken } from './jwtService';
import { AuthenticatedUser } from '../../domain/user/User';
import { logger } from '../logging/logger';

export const authMiddleware = async (token: string): Promise<AuthenticatedUser | null> => {
  if (!token) return null;

  try {
    const decoded = verifyAccessToken(token);

    const prisma = getPrismaClient();
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      logger.warn(`Token valid but user not found: ${decoded.userId}`);
      return null;
    }

    return user;
  } catch (error) {
    logger.debug(`Auth middleware error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};
