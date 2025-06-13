import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class UsuariosGuard implements CanActivate {

    // Verifica si el usuario es superadmin o es el propio perfil
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const identificacion = +request.params.identificacion;

        if (!user) return false;

        const esSuperadmin = user.roles?.includes('superadmin');
        const esPropioPerfil = user.identificacion == identificacion;

        return esSuperadmin || esPropioPerfil;
    }
}
