import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles =
      this.reflector.get<string[]>('roles', context.getHandler()) ||
      this.reflector.get<string[]>('roles', context.getClass());

    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const hasRole = roles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException({
        message:
          'No tienes los permisos necesarios para acceder a este recurso',
        error: 'NOT_ACCESS',
        statusCode: 403,
      });
    }

    return hasRole;
  }
}
