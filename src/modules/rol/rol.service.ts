import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { RoleResponse, RoleRequest } from './dto/rol.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class RolService {
    constructor(private supabaseService: SupabaseService) { }

    // Obtiene todos los roles
    async findAll(): Promise<RoleResponse> {
        try {
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('rol')
                    .select('*')
                    .order('created_at', { ascending: false });

            if (error) {
                throw new InternalServerErrorException('Error al obtener roles: ' + error.message);
            }

            return {
                status: true,
                message: 'Roles encontrados correctamente',
                data: data,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener roles',
                error: error.message,
                data: []
            };
        }
    }

    // Obtiene un rol por su ID
    async findOne(id: number): Promise<RoleResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('rol')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException('Error al buscar rol: ' + error.message);
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe un rol con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            return {
                status: true,
                message: 'Rol encontrado correctamente',
                data: data
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al buscar rol',
                error: error.message,
                data: []
            };
        }
    }

    // Crea un nuevo rol
    async create(createRequest: RoleRequest): Promise<RoleResponse> {
        try {
            // Crear el rol
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('rol')
                    .insert(createRequest)
                    .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear rol: ' + error.message);
            }

            return {
                status: true,
                message: 'Rol creado correctamente',
                data: data
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al crear rol',
                error: error.message,
                data: []
            };
        }
    }

    // Actualiza un rol
    async update(id: number, updateRequest: RoleRequest): Promise<RoleResponse> {
        try {
            // 1. Verificar si existe
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('rol')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar rol');
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe un rol con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            // 2. Validar si el nombre ya existe en otro rol
            const { data: existingRole, error: validationError } =
                await this.supabaseService.clientAdmin
                    .from('rol')
                    .select('id')
                    .eq('nombre', updateRequest.nombre.trim())
                    .neq('id', id)
                    .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de rol: ' + validationError.message);
            }

            if (existingRole) {
                return {
                    status: false,
                    message: 'Ya existe un rol con este nombre',
                    error: 'Nombre duplicado',
                    data: []
                }
            }

            // 3. Verificar si hay cambios
            if (
                existingData.nombre === updateRequest.nombre.trim() &&
                existingData.descripcion === updateRequest.descripcion?.trim()
            ) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en el rol',
                    error: 'Sin cambios',
                    data: existingData
                }
            }

            // 4. Actualizar el rol
            const { data, error } = await this.supabaseService.clientAdmin
                .from('rol')
                .update({
                    nombre: updateRequest.nombre.trim(),
                    descripcion: updateRequest.descripcion?.trim() || null,
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar rol: ' + error.message);
            }

            return {
                status: true,
                message: 'Rol actualizado correctamente',
                data: data,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al actualizar rol',
                error: error.message,
                data: []
            };
        }
    }

    // Elimina un rol
    async delete(id: number): Promise<RoleResponse> {
        try {
            // 1. Verificar si el rol existe
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('rol')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar rol: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe un rol con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            // 2. Verificar si está siendo usado en usuario_area
            const { data: usuariosArea, error: usuariosError } = await this.supabaseService.clientAdmin
                .from('usuario_area')
                .select('id, usuario_id')
                .eq('rol_id', id)
                .limit(5);

            if (usuariosError) {
                throw new InternalServerErrorException(
                    'Error al verificar uso del rol en usuario_area: ' + usuariosError.message,
                );
            }

            if (usuariosArea && usuariosArea.length > 0) {
                return {
                    status: false,
                    message: `No se puede eliminar el rol porque está siendo usado por ${usuariosArea.length} usuario(s)`,
                    error: 'Rol en uso',
                    data: []
                };
            }

            // 3. Eliminar el rol
            const { error } = await this.supabaseService.clientAdmin
                .from('rol')
                .delete()
                .eq('id', id);

            if (error) {
                throw new InternalServerErrorException('Error al eliminar rol: ' + error.message);
            }

            return {
                status: true,
                message: `Rol ${existingData.nombre} ha sido eliminado correctamente`,
                data: []
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al eliminar rol',
                error: error.message,
                data: []
            };
        }
    }
}
