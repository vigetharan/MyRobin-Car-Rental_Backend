import jwt, { SignOptions, VerifyOptions, Algorithm } from 'jsonwebtoken';
import crypto from 'crypto';
import { TokenService, TokenPayload, RefreshTokenPayload } from '../../application/auth/ports/TokenService';

/**
 * Security configuration for JWT tokens
 */
interface JwtConfig {
  algorithm: Algorithm;
  issuer: string;
  audience: string;
  accessTokenExpiry: SignOptions['expiresIn'];
  refreshTokenExpiry: SignOptions['expiresIn'];
}

/**
 * Get JWT configuration from environment with secure defaults
 */
const getJwtConfig = (): JwtConfig => ({
  algorithm: (process.env.JWT_ALGORITHM as Algorithm) || 'HS512', // Use HS512 for stronger security
  issuer: process.env.JWT_ISSUER || 'myrobin-car-rental',
  audience: process.env.JWT_AUDIENCE || 'myrobin-car-rental-api',
  accessTokenExpiry: (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'], // Shorter access token lifetime
  refreshTokenExpiry: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
});

/**
 * Validate JWT secret strength
 */
const validateSecret = (secret: string, name: string): void => {
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }
  // Warn if secret is too short (should be at least 256 bits for HS512)
  if (secret.length < 32) {
    console.warn(`WARNING: ${name} should be at least 32 characters for security`);
  }
};

/**
 * JWT implementation of TokenService port with enhanced security
 * 
 * Security features:
 * - HS512 algorithm (stronger than default HS256)
 * - Issuer and audience validation
 * - Shorter access token lifetime (15 min default)
 * - JTI (JWT ID) for token uniqueness
 */
export class JwtTokenService implements TokenService {
  private readonly config: JwtConfig;

  constructor() {
    this.config = getJwtConfig();
  }

  /**
   * Generate a unique JWT ID
   */
  private generateJti(): string {
    return crypto.randomUUID();
  }

  generateAccessToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET;
    validateSecret(secret!, 'JWT_SECRET');

    const options: SignOptions = {
      algorithm: this.config.algorithm,
      expiresIn: this.config.accessTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience,
      jwtid: this.generateJti(),
    };

    return jwt.sign(payload, secret!, options);
  }

  generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    validateSecret(secret!, 'JWT_REFRESH_SECRET');

    const options: SignOptions = {
      algorithm: this.config.algorithm,
      expiresIn: this.config.refreshTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience,
      jwtid: this.generateJti(),
    };

    return jwt.sign({ userId }, secret!, options);
  }

  verifyAccessToken(token: string): TokenPayload {
    const secret = process.env.JWT_SECRET;
    validateSecret(secret!, 'JWT_SECRET');

    const options: VerifyOptions = {
      algorithms: [this.config.algorithm],
      issuer: this.config.issuer,
      audience: this.config.audience,
    };

    return jwt.verify(token, secret!, options) as TokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const secret = process.env.JWT_REFRESH_SECRET;
    validateSecret(secret!, 'JWT_REFRESH_SECRET');

    const options: VerifyOptions = {
      algorithms: [this.config.algorithm],
      issuer: this.config.issuer,
      audience: this.config.audience,
    };

    return jwt.verify(token, secret!, options) as RefreshTokenPayload;
  }

  /**
   * Hash a refresh token for secure storage
   * Use this when storing refresh tokens in the database
   */
  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Compare a refresh token with its hash
   */
  compareRefreshToken(token: string, hash: string): boolean {
    const tokenHash = this.hashRefreshToken(token);
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
  }
}

// Singleton instance for convenience
export const jwtTokenService = new JwtTokenService();
