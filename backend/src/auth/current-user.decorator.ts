import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from './jwt';

/**
 * Injects the authenticated principal (`req.user`) into a controller handler.
 * Only valid on routes protected by JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: RequestUser }>();
    return request.user;
  },
);
