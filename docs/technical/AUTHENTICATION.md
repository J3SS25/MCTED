# Authentication & Session Security Reference

This document details the security architecture, password hashing standards, brute-force mitigation, and session handling mechanisms in MCTEB.

---

## 1. Password Cryptography (Scrypt)

Passwords are never stored in plaintext or with deprecated algorithms (MD5, SHA1, plain SHA256). MCTEB uses Node's native `node:crypto` **scrypt** key derivation function.

### Cryptographic Parameters (`apps/api/src/utils/crypto.ts`)

- **Salt**: 16 cryptographically random bytes generated via `crypto.randomBytes(16)`.
- **Derived Key Length**: 64 bytes (512 bits).
- **Cost Parameters**:
  - `N` (CPU/memory cost): 16,384
  - `r` (block size): 8
  - `p` (parallelization): 1
  - `maxmem`: 32 MB
- **Stored Representation**: Combined string format: `salt:derivedKeyHex`

```typescript
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}
```

---

## 2. Timing-Safe Verification

To defend against timing side-channel attacks (where an attacker measures microsecond response variances to deduce password hash segments), password comparison is executed using `crypto.timingSafeEqual`:

```typescript
export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  const [salt, key] = combinedHash.split(':');
  if (!salt || !key) return false;

  return new Promise((resolve) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      const keyBuffer = Buffer.from(key, 'hex');
      const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
      resolve(match);
    });
  });
}
```

---

## 3. Brute Force & Account Lockout Policy

To prevent automated credential stuffing and brute-force password guessing, the authentication service implements an account lockout counter:

1. **Threshold**: 5 consecutive failed login attempts on an account.
2. **Lockout Duration**: 15 minutes.
3. **Tracking**:
   - `failed_login_attempts` is incremented upon each invalid credential submission.
   - Upon the 5th failure, `lockout_until` is set to `DATETIME('now', '+15 minutes')`.
4. **Resolution**:
   - During the lockout window, any login attempt triggers a `423 Locked` HTTP status with the remaining lockout duration.
   - Upon a successful login with valid credentials, `failed_login_attempts` and `lockout_until` are immediately reset to 0 and NULL.
5. **Anti-Enumeration Response**: For non-existent accounts, the system executes a dummy scrypt computation before returning a generic `401 Unauthorized` response to prevent email timing enumeration.

---

## 4. Session Architecture

MCTEB implements server-side session tokens persisted in the SQLite `sessions` table:

```sql
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    expires_at TEXT NOT NULL
);
```

### Session Characteristics

- **Token Generation**: 32 cryptographically random bytes generated via `crypto.randomBytes(32).toString('hex')`.
- **Default TTL**: 7 days from authentication timestamp.
- **Dual Transport Support**:
  1. **HTTP-Only Cookie**: Transmitted via `Set-Cookie: session_token=...; HttpOnly; SameSite=Lax; Path=/`.
  2. **Bearer Header**: Accepted via `Authorization: Bearer <token>` for programmatic API consumers and mobile clients.
- **Immediate Invalidation**: Calling `POST /api/v1/auth/logout` deletes the token from SQLite, instantly revoking all active requests using that token.

---

## 5. Municipal Eligibility Validation

Under municipal tool lending guidelines in Basco, Batanes, borrowers must be legal adults to enter into financial and equipment liability agreements.

During registration (`POST /api/v1/auth/register`), the user's `birth_date` is checked:

```typescript
const birthDate = new Date(input.birth_date);
const today = new Date();
const age = today.getFullYear() - birthDate.getFullYear();
if (age < 18) {
  throw AppError.badRequest('Borrowers must be at least 18 years old under Municipal policies');
}
```

Registrations with age < 18 are rejected with a descriptive HTTP 400 validation error.

---

## 6. Administrative Safeguards

To prevent catastrophic administrative lockout:

1. **Self-Suspension Guard**: An active administrator cannot suspend their own account.
2. **Sole Administrator Demotion Guard**: The system checks total active administrator count before allowing role demotion. If only one administrator exists in the system, demoting that administrator to 'Municipal Staff' or 'Borrower' is rejected with `400 Bad Request`.
