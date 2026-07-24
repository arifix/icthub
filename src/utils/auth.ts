import bcrypt from "bcryptjs";

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Higher salt rounds for better security
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns Promise<boolean> - True if password matches
 */
export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Check if a string is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
 * @param str - String to check
 * @returns boolean - True if string appears to be a bcrypt hash
 */
export const isHashedPassword = (str: string): boolean => {
  return /^\$2[aby]\$\d{2}\$/.test(str);
};
