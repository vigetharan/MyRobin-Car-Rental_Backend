/**
 * Port for password hashing operations
 */
export interface PasswordHasher {
  /**
   * Hash a plain text password
   */
  hash(password: string): Promise<string>;

  /**
   * Compare a plain text password with a hash
   */
  compare(password: string, hash: string): Promise<boolean>;
}
