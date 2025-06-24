import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class UsuariosGuard implements CanActivate {
    constructor(private supabaseService: SupabaseService) {}

    // Verifica si el usuario es superadmin o es el propio perfil
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const userId = +request.params.id;

        if (!user) return false;

        const esSuperadmin = user.roles?.includes('superadmin');
        
        if (esSuperadmin) return true;

        // Buscar el ID real del usuario usando su identificación
        const { data: userData } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .select('id')
            .eq('identificacion', user.identificacion)
            .single();

        const esPropioPerfil = userData?.id === userId;

        return esPropioPerfil;
    }
}
