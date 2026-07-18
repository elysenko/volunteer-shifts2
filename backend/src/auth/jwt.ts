import { Role } from '@prisma/client';

/**
 * Shape of the JWT payload signed on login/signup.
 * `sub` is the user id (JWT standard subject claim).
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/**
 * Authenticated principal attached to `req.user` by JwtAuthGuard.
 */
export interface RequestUser {
  userId: string;
  email: string;
  role: Role;
}
