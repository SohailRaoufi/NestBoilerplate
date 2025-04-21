import type { JwtModuleOptions } from '@nestjs/jwt';
/**
 * JWT options for the JWT module. This options is used for user authentication.
 */
export const jwtUserOptions = {
  global: true,
  secret: process.env.USER_JWT_SECRET,
  signOptions: { expiresIn: process.env.USER_JWT_EXPIRES_IN },
} as JwtModuleOptions;

/**
 * JWT options for the JWT module. This options is used for admin authentication.
 */
export const jwtAdminOptions = {
  global: false,
  secret: process.env.ADMIN_JWT_SECRET,
  signOptions: { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN },
} as JwtModuleOptions;
