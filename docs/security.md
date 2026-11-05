# Security Protocols & Policies

## Controls Implemented

1. **Password Hashing & Timing-Safe Verification**: Passwords are saved with strong random cryptographic salt using scrypt key derivation. Verifications utilize `crypto.timingSafeEqual`.
2. **Account Lockout**: After 5 consecutive failed login attempts, accounts enter a 15-minute lockout period. Generic error responses avoid email enumeration.
3. **IDOR & Server-Enforced RBAC**: Every borrower query scopes access by `req.user.id` from the verified session, not from client parameters.
4. **Administrative Safeguards**: Administrators cannot suspend their own active session or demote the sole remaining administrator.
5. **Input Validation**: All incoming requests parse against Zod schemas on the server before reaching services.
6. **Rate Limiting**: Global requests are capped to 300 / 15 minutes, with stricter limits on `/auth/*` (10 attempts / 15 minutes).
7. **HTTP Headers**: Enforced via `helmet` (CSP, frame-ancestors, X-Content-Type-Options).

