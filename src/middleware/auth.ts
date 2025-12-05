import jwt from 'jsonwebtoken';
import { Database } from '../config/database';
import { logger } from '../utils/logger';

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export const authMiddleware = async (token: string): Promise<AuthenticatedUser | null> => {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as TokenPayload;
    
    const user = await Database.getInstance().user.findFirst({
      where: { 
        id: decoded.userId,
        deletedAt: null // Check for soft deleted users
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