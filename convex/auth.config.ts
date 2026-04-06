/**
 * Convex custom JWT auth provider for WorkOS.
 *
 * NOTA IMPORTANTE: El `issuer` y `jwks` exactos deben verificarse decodificando
 * un access token real de WorkOS en jwt.io después del primer login. El claim
 * `iss` del token es el valor correcto para `issuer`. El `jwks` se encuentra
 * en el discovery endpoint `{issuer}/.well-known/openid-configuration`.
 *
 * Valores placeholder usados:
 * - issuer: https://api.workos.com/user_management/<CLIENT_ID>
 * - jwks:   https://api.workos.com/sso/jwks/<CLIENT_ID>
 *
 * Si estos no coinciden, Convex rechazará todos los tokens con "Invalid issuer".
 */
export default {
  providers: [
    {
      type: 'customJwt',
      issuer: `https://api.workos.com/user_management/${process.env.WORKOS_CLIENT_ID}`,
      jwks: `https://api.workos.com/sso/jwks/${process.env.WORKOS_CLIENT_ID}`,
      algorithm: 'RS256',
      applicationID: process.env.WORKOS_CLIENT_ID,
    },
  ],
}
