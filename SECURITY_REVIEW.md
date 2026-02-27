# Security Review (Static Analysis)

Date: 2026-02-27  
Scope: repository code + dependency audit attempt

## Dependency audit status

- `npm audit --json` could not be completed in this environment because the npm advisory API returned `403 Forbidden`.
- A `package-lock.json` was generated first (`npm i --package-lock-only`) because the repository did not include one, which is required by `npm audit`.

## Findings

### 1) Password reset token is not invalidated after use (High)
- In `resetPassword`, the code updates the user password but does not mark the reset token as `USED`/`EXPIRED` and does not delete it after successful use.
- This allows token reuse until natural expiry if the token is leaked.

### 2) OTP/reset secrets are low-entropy and globally unique-constrained (High)
- OTPs are generated as 5-digit numeric codes (`generateOtp`).
- `UserSecurityAction.secret` is marked globally `unique`, meaning short secrets are shared in one namespace across all users and action types.
- This design increases collision pressure and encourages weak token space.

### 3) CORS is configured from environment, with wildcard in checked-in env files (Medium)
- `corsConfigs.origin` is loaded directly from `CORS_ORIGINS`.
- `.env.example` and `.env.dev` both set `CORS_ORIGINS="*"` while credentials are enabled.
- Depending on framework behavior, this can lead to insecure cross-origin exposure or misconfiguration drift into non-dev environments.

### 4) API docs exposure can be enabled without route protection (Medium)
- Swagger docs are mounted at `/docs` whenever `SWAGGER_ENABLED === 'true'`.
- No authentication/authorization guard is applied on docs route in `setupSwagger`.
- In production-like environments, this can disclose API surface and schemas.

### 5) Hardcoded email event payload present in service method (Low)
- `sendEmailOtp()` emits an event containing hardcoded email, token, and test content.
- While likely test/dev code, checked-in hardcoded outbound data paths can cause accidental leaks or abuse if invoked.

## Recommended next actions

1. Invalidate password reset records immediately after successful password change (mark used and/or delete) and consider one-time-use enforcement transactionally.
2. Replace numeric 5-digit secrets with cryptographically strong random tokens (e.g., 32-byte base64url) for password reset; keep short OTP only for explicit OTP flows with strict rate limits.
3. Remove global unique constraint on `secret` and instead index by `(user_id, type, status, expired_at)` as needed.
4. Lock CORS to explicit origin allowlists per environment and avoid wildcard in committed env templates.
5. Gate `/docs` behind admin auth or disable it in non-development environments by default.
6. Remove hardcoded test payload method or guard it behind non-production feature flags.
