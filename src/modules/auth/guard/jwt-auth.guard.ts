import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        error: 'TOKEN_EXPIRED',
        statusCode: 401,
      });
    }

    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException({
        message: 'Token no valido',
        error: 'INVALID_TOKEN',
        statusCode: 401,
      });
    }

    if (err?.status === 403) {
      throw new ForbiddenException({
        message:
          'No tienes los permisos necesarios para acceder a este recurso',
        error: 'NOT_ACCESS',
        statusCode: 403,
      });
    }

    if (err || !user) {
      throw new UnauthorizedException({
        message: 'No tienes acceso a esta información',
        error: 'UNAUTHORIZED',
        statusCode: 401,
      });
    }

    return user;
  }
}
