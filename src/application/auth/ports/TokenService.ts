/**
 * Port for token generation and verification
 */
export interface TokenPayload {
  userId: string; // UUID
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string; // UUID
}

export interface TokenService {
  /**
   * Generate an access token
   */
  generateAccessToken(payload: TokenPayload): string;

  /**
   * Generate a refresh token
   */
  generateRefreshToken(userId: string): string;

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): TokenPayload;

  /**
   * Verify and decode a refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload;
}
