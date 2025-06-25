import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import {
    UsuarioRequest,
    UsuarioUpdateRequest,
    UsuarioResponse,
    UsuarioCompleto,
    UsuarioAsignacion,
    ActualizarEstadoUsuario,
    ChangePasswordDto,
    // Legacy interfaces para compatibilidad
    NuevoUsuario,
    ActualizarUsuario
} from './dto/usuarios.dto';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class UsuariosService {
    constructor(private supabaseService: SupabaseService) { }

    // Obtiene todos los usuarios con sus asignaciones
    async findAll(): Promise<UsuarioResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select(`
                    id,
                    identificacion,
                    nombre,
                    apellido,
                    telefono,
                    correo,
                    avatar,
                    descripcion,
                    cargo,
                    activo,
                    created_at,
                    updated_at
                `)
                .order('created_at', { ascending: false });

            if (error) {
                throw new InternalServerErrorException('Error al obtener usuarios: ' + error.message);
            }

            // Obtener asignaciones para cada usuario
            const usuariosCompletos: UsuarioCompleto[] = [];
            for (const usuario of data || []) {
                const asignaciones = await this.getUsuarioAsignaciones(usuario.id);
                usuariosCompletos.push({
                    ...usuario,
                    cargo: usuario.cargo,
                    asignaciones
                });
            }

            return {
                status: true,
                message: 'Usuarios encontrados correctamente',
                data: usuariosCompletos
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener usuarios',
                error: error.message
            };
        }
    }

    // Obtiene un usuario por ID con sus asignaciones
    async findOne(id: number): Promise<UsuarioResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select(`
                    id,
                    identificacion,
                    nombre,
                    apellido,
                    telefono,
                    correo,
                    avatar,
                    descripcion,
                    cargo,
                    activo,
                    created_at,
                    updated_at
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException('Error al obtener usuario: ' + error.message);
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe un usuario con el ID ${id}`,
                    error: 'ID no encontrado'
                };
            }

            // Obtener asignaciones del usuario
            const asignaciones = await this.getUsuarioAsignaciones(data.id);
            const usuarioCompleto: UsuarioCompleto = {
                ...data,
                cargo: data.cargo,
                asignaciones
            };

            return {
                status: true,
                message: 'Usuario encontrado correctamente',
                data: usuarioCompleto
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener usuario',
                error: error.message
            };
        }
    }

    // Crea un nuevo usuario con área y rol asignados
    async create(createRequest: UsuarioRequest): Promise<UsuarioResponse> {
        try {
            // 1. Validar si área existe
            const { data: existingArea, error: areaError } = await this.supabaseService.clientAdmin
                .from('area')
                .select('id, nombre')
                .eq('id', createRequest.area_id)
                .maybeSingle();

            if (areaError) {
                throw new InternalServerErrorException('Error al validar área: ' + areaError.message);
            }

            if (!existingArea) {
                return {
                    status: false,
                    message: `No existe un área con el ID ${createRequest.area_id}`,
                    error: 'Área no encontrada'
                };
            }

            // 2. Validar si rol existe
            const { data: existingRol, error: rolError } = await this.supabaseService.clientAdmin
                .from('rol')
                .select('id, nombre')
                .eq('id', createRequest.rol_id)
                .maybeSingle();

            if (rolError) {
                throw new InternalServerErrorException('Error al validar rol: ' + rolError.message);
            }

            if (!existingRol) {
                return {
                    status: false,
                    message: `No existe un rol con el ID ${createRequest.rol_id}`,
                    error: 'Rol no encontrado'
                };
            }

            // 3. Validar duplicados de forma específica
            // Validar identificación duplicada
            const { data: existingByIdentificacion } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('identificacion')
                .eq('identificacion', createRequest.identificacion)
                .maybeSingle();

            if (existingByIdentificacion) {
                return {
                    status: false,
                    message: `El número de identificación ${createRequest.identificacion} ya está registrado en el sistema`,
                    error: 'Identificación duplicada'
                };
            }

            // Validar correo duplicado
            const { data: existingByCorreo } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('correo')
                .eq('correo', createRequest.correo)
                .maybeSingle();

            if (existingByCorreo) {
                return {
                    status: false,
                    message: `El correo electrónico ${createRequest.correo} ya está registrado en el sistema`,
                    error: 'Correo duplicado'
                };
            }

            // Validar teléfono duplicado
            const { data: existingByTelefono } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('telefono')
                .eq('telefono', createRequest.telefono)
                .maybeSingle();

            if (existingByTelefono) {
                return {
                    status: false,
                    message: `El número de teléfono ${createRequest.telefono} ya está registrado en el sistema`,
                    error: 'Teléfono duplicado'
                };
            }

            // 4. Hash de la contraseña
            const hashedPassword = await bcrypt.hash(
                createRequest.identificacion.toString(),
                10,
            );

            // 5. Crear usuario
            const usuario_data = {
                identificacion: createRequest.identificacion,
                nombre: createRequest.nombre,
                apellido: createRequest.apellido,
                telefono: createRequest.telefono,
                correo: createRequest.correo,
                descripcion: createRequest.descripcion || null,
                avatar: createRequest.avatar || null,
                cargo: createRequest.cargo || null,
                contrasena: hashedPassword,
                activo: true
            };

            const { data: userData, error: userError } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .insert([usuario_data])
                .select('*')
                .single();

            if (userError) {
                // Manejo específico de errores de duplicados de la BD
                if (userError.code === '23505') {
                    if (userError.message.includes('profile_identification_key') || userError.message.includes('identificacion')) {
                        return {
                            status: false,
                            message: `El número de identificación ${createRequest.identificacion} ya está registrado en el sistema`,
                            error: 'Identificación duplicada'
                        };
                    }
                    if (userError.message.includes('profile_email_key') || userError.message.includes('correo')) {
                        return {
                            status: false,
                            message: `El correo electrónico ${createRequest.correo} ya está registrado en el sistema`,
                            error: 'Correo duplicado'
                        };
                    }
                    if (userError.message.includes('profile_phone_key') || userError.message.includes('telefono')) {
                        return {
                            status: false,
                            message: `El número de teléfono ${createRequest.telefono} ya está registrado en el sistema`,
                            error: 'Teléfono duplicado'
                        };
                    }
                }
                throw new InternalServerErrorException('Error al crear usuario: ' + userError.message);
            }

            // 6. Crear asignación usuario_area
            const { data: asignacionData, error: asignacionError } = await this.supabaseService.clientAdmin
                .from('usuario_area')
                .insert([{
                    usuario_id: userData.id,
                    area_id: createRequest.area_id,
                    rol_id: createRequest.rol_id
                }])
                .select(`
                    id,
                    created_at,
                    updated_at,
                    area:area_id!inner (id, nombre, descripcion),
                    rol:rol_id!inner (id, nombre, descripcion)
                `)
                .single();

            if (asignacionError) {
                // Si falla la asignación, eliminar el usuario creado
                await this.supabaseService.clientAdmin
                    .from('usuarios')
                    .delete()
                    .eq('id', userData.id);

                throw new InternalServerErrorException('Error al crear asignación: ' + asignacionError.message);
            }

            // 7. Construir respuesta
            const usuarioCompleto: UsuarioCompleto = {
                id: userData.id,
                identificacion: userData.identificacion,
                nombre: userData.nombre,
                apellido: userData.apellido,
                telefono: userData.telefono,
                correo: userData.correo,
                avatar: userData.avatar,
                descripcion: userData.descripcion,
                cargo: userData.cargo,
                activo: userData.activo,
                created_at: userData.created_at,
                updated_at: userData.updated_at,
                asignaciones: [{
                    id: asignacionData.id,
                    area: Array.isArray(asignacionData.area) ? asignacionData.area[0] : asignacionData.area,
                    rol: Array.isArray(asignacionData.rol) ? asignacionData.rol[0] : asignacionData.rol,
                    created_at: asignacionData.created_at,
                    updated_at: asignacionData.updated_at
                }]
            };

            return {
                status: true,
                message: 'Usuario creado correctamente',
                data: usuarioCompleto
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al crear usuario',
                error: error.message
            };
        }
    }

    // Actualiza un usuario (puede incluir cambio de área y rol)
    async update(id: number, updateRequest: UsuarioUpdateRequest): Promise<UsuarioResponse> {
        try {
            // 1. Verificar si el usuario existe
            const { data: existingData, error: checkError } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar usuario: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe un usuario con el ID ${id}`,
                    error: 'ID no encontrado'
                };
            }

            // 2. Si se va a cambiar área, validar que existe
            if (updateRequest.area_id && updateRequest.area_id !== undefined) {
                const { data: existingArea, error: areaError } = await this.supabaseService.clientAdmin
                    .from('area')
                    .select('id')
                    .eq('id', updateRequest.area_id)
                    .maybeSingle();

                if (areaError) {
                    throw new InternalServerErrorException('Error al validar área: ' + areaError.message);
                }

                if (!existingArea) {
                    return {
                        status: false,
                        message: `No existe un área con el ID ${updateRequest.area_id}`,
                        error: 'Área no encontrada'
                    };
                }
            }

            // 3. Si se va a cambiar rol, validar que existe
            if (updateRequest.rol_id && updateRequest.rol_id !== undefined) {
                const { data: existingRol, error: rolError } = await this.supabaseService.clientAdmin
                    .from('rol')
                    .select('id')
                    .eq('id', updateRequest.rol_id)
                    .maybeSingle();

                if (rolError) {
                    throw new InternalServerErrorException('Error al validar rol: ' + rolError.message);
                }

                if (!existingRol) {
                    return {
                        status: false,
                        message: `No existe un rol con el ID ${updateRequest.rol_id}`,
                        error: 'Rol no encontrado'
                    };
                }
            }

            // 4. Validar duplicados (si se van a cambiar campos únicos)
            if (updateRequest.identificacion !== undefined) {
                const { data: existingByIdentificacion } = await this.supabaseService.clientAdmin
                    .from('usuarios')
                    .select('identificacion')
                    .eq('identificacion', updateRequest.identificacion)
                    .neq('id', id)
                    .maybeSingle();

                if (existingByIdentificacion) {
                    return {
                        status: false,
                        message: `El número de identificación ${updateRequest.identificacion} ya está registrado por otro usuario`,
                        error: 'Identificación duplicada'
                    };
                }
            }

            if (updateRequest.correo !== undefined) {
                const { data: existingByCorreo } = await this.supabaseService.clientAdmin
                    .from('usuarios')
                    .select('correo')
                    .eq('correo', updateRequest.correo)
                    .neq('id', id)
                    .maybeSingle();

                if (existingByCorreo) {
                    return {
                        status: false,
                        message: `El correo electrónico ${updateRequest.correo} ya está registrado por otro usuario`,
                        error: 'Correo duplicado'
                    };
                }
            }

            if (updateRequest.telefono !== undefined) {
                const { data: existingByTelefono } = await this.supabaseService.clientAdmin
                    .from('usuarios')
                    .select('telefono')
                    .eq('telefono', updateRequest.telefono)
                    .neq('id', id)
                    .maybeSingle();

                if (existingByTelefono) {
                    return {
                        status: false,
                        message: `El número de teléfono ${updateRequest.telefono} ya está registrado por otro usuario`,
                        error: 'Teléfono duplicado'
                    };
                }
            }


            // 5. Verificar si hay cambios en datos del usuario
            const { area_id, rol_id, ...updateData } = updateRequest;

            // Remover campos undefined
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            // Verificar cambios en datos del usuario
            let hayCambiosUsuario = false;
            if (Object.keys(updateData).length > 0) {
                hayCambiosUsuario = Object.keys(updateData).some(key =>
                    existingData[key] !== updateData[key]
                );
            }

            // Verificar cambios en asignaciones
            let hayCambiosAsignacion = false;
            let currentAsignacion: any = null;

            if (updateRequest.area_id !== undefined || updateRequest.rol_id !== undefined) {
                const { data: asignacion } = await this.supabaseService.clientAdmin
                    .from('usuario_area')
                    .select('id, area_id, rol_id')
                    .eq('usuario_id', id)
                    .maybeSingle();

                currentAsignacion = asignacion;

                if (asignacion) {
                    if (updateRequest.area_id !== undefined && asignacion.area_id !== updateRequest.area_id) {
                        hayCambiosAsignacion = true;
                    }
                    if (updateRequest.rol_id !== undefined && asignacion.rol_id !== updateRequest.rol_id) {
                        hayCambiosAsignacion = true;
                    }
                }
            }

            // Si no hay cambios en absoluto, retornar sin cambios
            if (!hayCambiosUsuario && !hayCambiosAsignacion) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en el usuario',
                    error: 'Sin cambios',
                    data: undefined
                };
            }

            // 6. Actualizar datos del usuario (solo si hay cambios)
            if (hayCambiosUsuario && Object.keys(updateData).length > 0) {
                const { error: updateError } = await this.supabaseService.clientAdmin
                    .from('usuarios')
                    .update(updateData)
                    .eq('id', id);

                if (updateError) {
                    // Manejo específico de errores de duplicados de la BD
                    if (updateError.code === '23505') {
                        if (updateError.message.includes('profile_identification_key') || updateError.message.includes('identificacion')) {
                            return {
                                status: false,
                                message: `El número de identificación ${updateRequest.identificacion} ya está registrado en el sistema`,
                                error: 'Identificación duplicada'
                            };
                        }
                        if (updateError.message.includes('profile_email_key') || updateError.message.includes('correo')) {
                            return {
                                status: false,
                                message: `El correo electrónico ${updateRequest.correo} ya está registrado en el sistema`,
                                error: 'Correo duplicado'
                            };
                        }
                        if (updateError.message.includes('profile_phone_key') || updateError.message.includes('telefono')) {
                            return {
                                status: false,
                                message: `El número de teléfono ${updateRequest.telefono} ya está registrado en el sistema`,
                                error: 'Teléfono duplicado'
                            };
                        }
                    }
                    throw new InternalServerErrorException('Error al actualizar usuario: ' + updateError.message);
                }
            }

            // 7. Actualizar asignación (solo si hay cambios)
            if (hayCambiosAsignacion && currentAsignacion) {
                const asignacionUpdate: any = {};
                if (updateRequest.area_id !== undefined) asignacionUpdate.area_id = updateRequest.area_id;
                if (updateRequest.rol_id !== undefined) asignacionUpdate.rol_id = updateRequest.rol_id;

                if (Object.keys(asignacionUpdate).length > 0) {
                    const { error: asignacionError } = await this.supabaseService.clientAdmin
                        .from('usuario_area')
                        .update(asignacionUpdate)
                        .eq('usuario_id', id);

                    if (asignacionError) {
                        throw new InternalServerErrorException('Error al actualizar asignación: ' + asignacionError.message);
                    }
                }
            }

            return {
                status: true,
                message: 'Usuario actualizado correctamente',
                data: undefined
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al actualizar usuario',
                error: error.message
            };
        }
    }

    // Elimina un usuario y sus asignaciones (CASCADE)
    async delete(id: number): Promise<UsuarioResponse> {
        try {
            // 1. Verificar si el usuario existe
            const { data: existingData, error: checkError } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('id, nombre, apellido')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar usuario: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe un usuario con el ID ${id}`,
                    error: 'ID no encontrado'
                };
            }

            // 2. Eliminar asignaciones usuario_area (CASCADE)
            const { error: asignacionError } = await this.supabaseService.clientAdmin
                .from('usuario_area')
                .delete()
                .eq('usuario_id', id);

            if (asignacionError) {
                throw new InternalServerErrorException('Error al eliminar asignaciones: ' + asignacionError.message);
            }

            // 3. Eliminar usuario
            const { error: deleteError } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw new InternalServerErrorException('Error al eliminar usuario: ' + deleteError.message);
            }

            return {
                status: true,
                message: `Usuario ${existingData.nombre} ${existingData.apellido} ha sido eliminado correctamente`,
                data: undefined
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al eliminar usuario',
                error: error.message
            };
        }
    }

    // Método auxiliar para obtener asignaciones de un usuario
    private async getUsuarioAsignaciones(usuarioId: number): Promise<UsuarioAsignacion[]> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('usuario_area')
            .select(`
                id,
                created_at,
                updated_at,
                area:area_id!inner (id, nombre, descripcion),
                rol:rol_id!inner (id, nombre, descripcion)
            `)
            .eq('usuario_id', usuarioId);

        if (error) {
            return [];
        }

        return (data || []).map(item => ({
            id: item.id,
            area: Array.isArray(item.area) ? item.area[0] : item.area,
            rol: Array.isArray(item.rol) ? item.rol[0] : item.rol,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }

    // Método para cambiar contraseña
    async changePassword(id: number, dto: ChangePasswordDto): Promise<UsuarioResponse> {
        try {
            // Verificar si el usuario existe
            const { data: usuario, error: userError } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('id, contrasena')
                .eq('id', id)
                .maybeSingle();

            if (userError) {
                throw new InternalServerErrorException('Error al verificar usuario: ' + userError.message);
            }

            if (!usuario) {
                return {
                    status: false,
                    message: `No existe un usuario con el ID ${id}`,
                    error: 'Usuario no encontrado'
                };
            }

            // Verificar contraseña actual
            const isValidPassword = await bcrypt.compare(dto.currentPassword, usuario.contrasena);
            if (!isValidPassword) {
                return {
                    status: false,
                    message: 'La contraseña actual es incorrecta',
                    error: 'Contraseña incorrecta'
                };
            }

            // Hash de la nueva contraseña
            const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

            // Actualizar contraseña
            const { error: updateError } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .update({ contrasena: hashedNewPassword })
                .eq('id', id);

            if (updateError) {
                throw new InternalServerErrorException('Error al actualizar contraseña: ' + updateError.message);
            }

            return {
                status: true,
                message: 'Contraseña actualizada correctamente',
                data: undefined
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al cambiar contraseña',
                error: error.message
            };
        }
    }

    // Método para actualizar estado
    async actualizarEstado(id: number, dto: ActualizarEstadoUsuario): Promise<UsuarioResponse> {
        try {
            // Verificar si el usuario existe
            const { data: existingData, error: checkError } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('id, activo')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar usuario: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe un usuario con el ID ${id}`,
                    error: 'Usuario no encontrado'
                };
            }

            // Actualizar estado
            const { error: updateError } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .update({ activo: dto.activo })
                .eq('id', id);

            if (updateError) {
                throw new InternalServerErrorException('Error al actualizar estado: ' + updateError.message);
            }

            return {
                status: true,
                message: `Usuario ${dto.activo ? 'activado' : 'desactivado'} correctamente`,
                data: undefined
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al actualizar estado',
                error: error.message
            };
        }
    }

    // MÉTODOS LEGACY (para mantener compatibilidad durante la transición)
    async findByIdentificacion(identificacion: number) {
        return this.findOne(identificacion);
    }

    async createLegacy(createRequest: NuevoUsuario) {
        // Para compatibilidad, crear sin área/rol asignados
        throw new BadRequestException('Debe usar el nuevo método create que requiere área y rol');
    }

    async updateLegacy(id: number, updateDto: ActualizarUsuario) {
        return this.update(id, updateDto);
    }
}

