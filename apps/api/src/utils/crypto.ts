import crypto from 'crypto';

/**
 * Robust, dependency-free password hashing using Node crypto scrypt.
 * Format: scrypt$<salt_hex>$<hash_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`scrypt$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return resolve(false);
    }

    const salt = parts[1];
    const originalHash = parts[2];
    if (!salt || !originalHash) {
      return resolve(false);
    }

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      const originalBuffer = Buffer.from(originalHash, 'hex');
      if (originalBuffer.length !== derivedKey.length) {
        return resolve(false);
      }
      resolve(crypto.timingSafeEqual(originalBuffer, derivedKey));
    });
  });
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

