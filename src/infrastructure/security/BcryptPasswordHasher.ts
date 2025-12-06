import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PasswordHasher } from '../../application/auth/ports/PasswordHasher';

/**
 * Bcrypt implementation of PasswordHasher port with enhanced security
 * 
 * Security features:
 * - Configurable salt rounds (default 12, recommended for production)
 * - Optional pepper (server-side secret) for additional security layer
 * - Timing-safe comparison to prevent timing attacks
 */
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;
  private readonly pepper: string | undefined;

  /**
   * @param saltRounds - Number of bcrypt salt rounds (default: 12)
   *                     Higher = more secure but slower
   *                     Recommended: 10-12 for most applications
   * @param pepper - Optional server-side secret added to passwords before hashing
   *                 Should be stored securely (env variable, not in code)
   */
  constructor(saltRounds: number = 12, pepper?: string) {
    this.saltRounds = saltRounds;
    this.pepper = pepper || process.env.PASSWORD_PEPPER;
    
    // Warn if salt rounds are too low
    if (saltRounds < 10) {
      console.warn('WARNING: Salt rounds below 10 may not be secure enough');
    }
  }

  /**
   * Apply pepper to password if configured
   */
  private applyPepper(password: string): string {
    if (!this.pepper) {
      return password;
    }
    // Use HMAC to combine password with pepper
    return crypto.createHmac('sha256', this.pepper).update(password).digest('hex');
  }

  /**
   * Hash a password with bcrypt
   * If pepper is configured, it's applied before hashing
   */
  async hash(password: string): Promise<string> {
    const pepperedPassword = this.applyPepper(password);
    return bcrypt.hash(pepperedPassword, this.saltRounds);
  }

  /**
   * Compare a password with its hash
   * Uses timing-safe comparison internally via bcrypt
   */
  async compare(password: string, hash: string): Promise<boolean> {
    const pepperedPassword = this.applyPepper(password);
    return bcrypt.compare(pepperedPassword, hash);
  }

  /**
   * Check if a password meets minimum security requirements
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { valid: errors.length === 0, errors };
  }
}

// Singleton instance for convenience (uses env variable for pepper)
export const bcryptPasswordHasher = new BcryptPasswordHasher();
