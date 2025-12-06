import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

// Get expiry duration in seconds
const getExpirySeconds = (duration: string): number => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 86400; // Default 1 day
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 86400;
  }
};

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

// Decode token without verification (for getting expiry info)
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
};

// Get token expiry timestamp
export const getTokenExpiry = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry.getTime() < Date.now();
};

// Generate tokens with expiry info
export const generateTokenPair = (payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
} => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);
  
  const accessExpiry = process.env.JWT_EXPIRES_IN || '1d';
  const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: new Date(Date.now() + getExpirySeconds(accessExpiry) * 1000),
    refreshTokenExpiry: new Date(Date.now() + getExpirySeconds(refreshExpiry) * 1000),
  };
};
