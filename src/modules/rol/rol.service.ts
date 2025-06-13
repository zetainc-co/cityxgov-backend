import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { CreateRoleRequest, RoleResponse, Role } from './dto/rol.dto';

@Injectable()
export class RolService {
    constructor(private supabaseService: SupabaseService) { }

    // Obtiene todos los roles
    async findAll(): Promise<RoleResponse> {
        try {
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('rol')
                    .select('id, nombre, descripcion, created_at, updated_at')
                    .order('created_at', { ascending: false });

            if (error) {
                throw new InternalServerErrorException('Error al obtener roles: ' + error.message);
            }

            return {
                status: true,
                message: 'Roles encontrados correctamente',
                data: data.map(rol => ({
                    id: rol.id,
                    nombre: rol.nombre,
                    descripcion: rol.descripcion,
                    created_at: rol.created_at,
                    updated_at: rol.updated_at
                }))
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al obtener roles',
                error: error.message
            };
        }
    }

    // Obtiene un rol por su ID
    async findOne(id: number): Promise<RoleResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('rol')
                .select('id, nombre, descripcion, created_at, updated_at')
                .eq('id', id)
                .single();

            if (!data) {
                return {
                    status: false,
                    message: `No existe un rol con el ID ${id}`,
                    error: 'ID no encontrado'
                }
            }

            if (error) {
                if (error) {
                    throw new InternalServerErrorException('Error al obtener rol: ' + error);
                }
            }

            const role: Role = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return {
                status: true,
                message: 'Rol encontrado correctamente',
                data: [role]
            };
        } catch (error) {
            return {
                status: false,
                message: error.message,
                error: error.message
            };
        }
    }

    // Crea un nuevo rol
    async create(createRequest: CreateRoleRequest): Promise<RoleResponse> {
        try {
            // Crear el rol
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('rol')
                    .insert([{
                        nombre: createRequest.role.nombre,
                        descripcion: createRequest.role.descripcion || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select('id, nombre, descripcion, created_at, updated_at')
                    .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear rol: ' + error.message);
            }

            const roleCreated: Role = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return {
                status: true,
                message: 'Rol creado correctamente',
                data: [roleCreated]
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al crear rol',
                error: error.message
            };
        }
    }

    // Actualiza un rol
    async update(id: number, createRequest: CreateRoleRequest): Promise<RoleResponse> {
        try {
            // Primero verificar si existe
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
                    error: 'ID no encontrado'
                }
            }

            // Verificar si hay cambios
            const hasChanges =
                existingData.nombre !== createRequest.role.nombre ||
                existingData.descripcion !== createRequest.role.descripcion;

            if (!hasChanges) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en el rol',
                    error: 'Sin cambios',
                    data: [{
                        id: existingData.id,
                        nombre: existingData.nombre,
                        descripcion: existingData.descripcion,
                        created_at: existingData.created_at,
                        updated_at: existingData.updated_at
                    }]
                }
            }

            // Actualizar el rol
            const { data, error } = await this.supabaseService.clientAdmin
                .from('rol')
                .update({
                    nombre: createRequest.role.nombre,
                    descripcion: createRequest.role.descripcion,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('id, nombre, descripcion, created_at, updated_at')
                .single();

            if (error) {
                throw new ConflictException(error);
            }

            const updatedRole: Role = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return {
                status: true,
                message: 'Rol actualizado correctamente',
                data: [updatedRole]
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al actualizar rol',
                error: error.message
            };
        }
    }

    // Elimina un rol
    async delete(id: number): Promise<RoleResponse> {
        try {
            // Primero verificar si existe
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
                    error: 'ID no encontrado'
                }
            }

            const { error } = await this.supabaseService.clientAdmin
                .from('rol')
                .delete()
                .eq('id', id);

            if (error) {
                throw new ConflictException(error);
            }

            return {
                status: true,
                message: 'Rol eliminado correctamente',
                data: []
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al eliminar rol',
                error: error.message
            };
        }
    }
}
