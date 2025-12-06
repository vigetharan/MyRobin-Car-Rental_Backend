import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  } as SignOptions);
};

export const generateRefreshToken = (userId: number): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.verify(token, secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.verify(token, secret) as { userId: number };
};
