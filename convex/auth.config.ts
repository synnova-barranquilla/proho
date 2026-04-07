/**
 * Convex custom JWT auth provider for WorkOS AuthKit.
 *
 * WorkOS AuthKit access tokens are minimal by design — they only contain
 * `iss`, `sub`, `sid`, `jti`, `exp`, `iat`. There is no `aud` claim and no
 * `email`, so:
 *
 * 1. `applicationID` is intentionally omitted. Convex will warn about this
 *    being "potentially insecure" but it's required because there is no `aud`
 *    claim in the token. Our server-side callers are the only ones with a
 *    valid token anyway (the cookie is HttpOnly/encrypted).
 * 2. `email` and `name` are passed to mutations as arguments from the
 *    server-side loader, where `getAuth()` decrypts the session cookie and
 *    exposes the full user object. The mutations still authenticate the
 *    caller via `ctx.auth.getUserIdentity().subject` (the WorkOS user ID),
 *    which is cryptographically verified via the JWT.
 *
 * Requires Convex prod env var:
 *   WORKOS_CLIENT_ID=client_xxxxxxxxxxxxxxxx
 *
 * Set it with:
 *   pnpm convex env set WORKOS_CLIENT_ID client_xxxx --prod
 */
export default {
  providers: [
    {
      type: 'customJwt',
      issuer: `https://api.workos.com/user_management/${process.env.WORKOS_CLIENT_ID}`,
      jwks: `https://api.workos.com/sso/jwks/${process.env.WORKOS_CLIENT_ID}`,
      algorithm: 'RS256',
    },
  ],
}
