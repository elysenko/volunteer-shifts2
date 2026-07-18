import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { RequestUser } from './jwt';

/**
 * Requires the request to carry an authenticated ADMIN principal.
 * Must run AFTER JwtAuthGuard (which populates `req.user`).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }
    return true;
  }
}
