import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import {
    NuevoUsuario,
    UsuarioResponse,
    ActualizarUsuario,
    ActualizarEstadoUsuario
} from './dto/usuarios.dto';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class UsuariosService {
    constructor(private supabaseService: SupabaseService) { }

    // Obtiene todos los usuarios junto con sus áreas y roles.
    async findAll() {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new InternalServerErrorException('Error al obtener usuarios: ' + error.message);
        }
        return {
            status: true,
            message: 'Usuarios obtenidos correctamente',
            data: data
        }
    }

    // Busca un usuario por identificación
    async findOne(identificacion: number): Promise<UsuarioResponse> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .select('*')
            .eq('identificacion', identificacion)
            .single();

        if (!data) {
            throw new NotFoundException(
                `No se encontró ningún usuario con la identificación ${identificacion}`
            );
        }

        if (error) {
            throw new InternalServerErrorException('Error al obtener usuario: ' + error.message);
        }

        return {
            status: true,
            message: 'Usuario encontrado correctamente',
            data: data,
        };
    }

    // Crea un nuevo usuario.
    async create(createRequest: NuevoUsuario): Promise<UsuarioResponse> {
        try {
            console.log('Payload recibido en /usuarios:', createRequest); // <-- Log para depuración
            // 1. Validación de campos requeridos y tipos
            const missingFields: string[] = [];
            if (!createRequest.identificacion) missingFields.push('identificacion');
            if (!createRequest.nombre) missingFields.push('nombre');
            if (!createRequest.apellido) missingFields.push('apellido');
            if (!createRequest.telefono) missingFields.push('telefono');
            if (!createRequest.correo) missingFields.push('correo');

            // Validación de campos faltantes
            if (missingFields.length > 0) {
                throw new BadRequestException(`Campos faltantes: ${missingFields.join(', ')}`);
            }

            if (typeof createRequest.identificacion !== 'number') {
                throw new BadRequestException('identificacion debe ser un número');
            }
            if (typeof createRequest.telefono !== 'string') {
                throw new BadRequestException('telefono debe ser un string');
            }
            if (typeof createRequest.correo !== 'string') {
                throw new BadRequestException('correo debe ser un string');
            }

            // 2. Validación de duplicados en la tabla usuarios
            const { data: existingUser } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('identificacion, correo, telefono')
                .or(
                    `identificacion.eq.${createRequest.identificacion},correo.eq.${createRequest.correo},telefono.eq.${createRequest.telefono}`
                )
                .maybeSingle();

            if (existingUser) {
                if (existingUser.correo === createRequest.correo) {
                    throw new ConflictException('El correo electrónico ya está registrado');
                }
                if (existingUser.identificacion === createRequest.identificacion) {
                    throw new ConflictException('El número de identificación ya está registrado');
                }
                if (existingUser.telefono === createRequest.telefono) {
                    throw new ConflictException('El número de teléfono ya está registrado');
                }
            }

            // 3. Validar duplicado de correo en Supabase Auth
            const { data: authUser } = await this.supabaseService.clientAdmin
                .from('auth.users')
                .select('email')
                .eq('email', createRequest.correo)
                .maybeSingle();

            if (authUser) {
                throw new ConflictException('El correo electrónico ya está registrado en el sistema (Auth).');
            }

            // 4. Hash de la contraseña
            const hashedPassword = await bcrypt.hash(
                createRequest.identificacion.toString(),
                10,
            );

            // 5. Insertar en la tabla usuarios
            const usuario_perfil = {
                identificacion: createRequest.identificacion,
                nombre: createRequest.nombre,
                apellido: createRequest.apellido,
                telefono: createRequest.telefono,
                correo: createRequest.correo,
                avatar: createRequest.avatar,
                contrasena: hashedPassword,
                activo: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { data: userData, error: userProfileError } =
                await this.supabaseService.clientAdmin
                    .from('usuarios')
                    .insert([usuario_perfil])
                    .select('id, identificacion, nombre, apellido, telefono, correo, avatar, descripcion, activo, created_at, updated_at')
                    .single();

            if (userProfileError) {
                if (userProfileError.code === '23505') {
                    if (userProfileError.message.includes('telefono')) {
                        throw new ConflictException('El número de teléfono ya está registrado');
                    } else if (userProfileError.message.includes('correo')) {
                        throw new ConflictException('El correo electrónico ya está registrado');
                    } else if (
                        userProfileError.message.includes('identificacion') ||
                        userProfileError.details?.includes('identificacion')
                    ) {
                        throw new ConflictException('El número de identificación ya está registrado');
                    }
                }
                throw new InternalServerErrorException('Error al crear usuario: ' + userProfileError.message);
            }

            return {
                status: true,
                message: 'Usuario registrado correctamente',
                data: [{
                    id: userData.id,
                    identificacion: userData.identificacion,
                    nombre: userData.nombre,
                    apellido: userData.apellido,
                    telefono: userData.telefono,
                    correo: userData.correo,
                    avatar: userData.avatar,
                    descripcion: userData.descripcion,
                    activo: userData.activo,
                    created_at: userData.created_at,
                    updated_at: userData.updated_at
                }]
            };
        } catch (error) {
            if (
                error instanceof ConflictException ||
                error instanceof BadRequestException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }
            throw new InternalServerErrorException('Error inesperado al crear usuario: ' + (error.message || 'Error desconocido'));
        }
    }

    // Actualiza un usuario
    async update(identificacion: number, updateDto: ActualizarUsuario) {
        try {
            // 1. Obtener el usuario actual
            const { data: usuarioActual, error: errorUsuario } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('identificacion, nombre, apellido, telefono, correo, descripcion, avatar')
                .eq('identificacion', identificacion)
                .single();

            if (errorUsuario || !usuarioActual) {
                return {
                    status: false,
                    message: `No se encontró ningún usuario con la identificación ${identificacion}`,
                    data: []
                };
            }

            // 2. Verificar si hay cambios reales antes de hacer cualquier validación
            const cambios: Record<string, any> = {};
            let hayCambios = false;

            for (const [campo, valor] of Object.entries(updateDto)) {
                if (valor !== undefined && valor !== usuarioActual[campo]) {
                    cambios[campo] = valor;
                    hayCambios = true;
                }
            }

            if (!hayCambios) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en los campos del usuario',
                    data: [usuarioActual]
                };
            }

            // 3. Solo validar campos únicos si realmente cambiaron
            const camposUnicos = ['identificacion', 'correo', 'telefono'];
            const camposACambiar = Object.keys(cambios);
            const camposUnicosACambiar = camposUnicos.filter(campo => camposACambiar.includes(campo));

            if (camposUnicosACambiar.length > 0) {
                const condiciones = camposUnicosACambiar
                    .map(campo => `${campo}.eq.${cambios[campo]}`)
                    .join(',');

                const { data: existingUsers } = await this.supabaseService.clientAdmin
                    .from('usuarios')
                    .select('identificacion, correo, telefono')
                    .or(condiciones)
                    .neq('identificacion', identificacion); // Excluir el usuario actual

                if (existingUsers && existingUsers.length > 0) {
                    // Verificar cada campo único que está cambiando
                    for (const campo of camposUnicosACambiar) {
                        const usuarioConflicto = existingUsers.find(u => u[campo] === cambios[campo]);
                        if (usuarioConflicto) {
                            const mensajes = {
                                identificacion: 'El número de identificación ya está registrado en el sistema',
                                correo: 'El correo electrónico ya está registrado en el sistema',
                                telefono: 'El número de teléfono ya está registrado en el sistema'
                            };
                            return {
                                status: false,
                                message: mensajes[campo],
                                data: []
                            };
                        }
                    }
                }
            }

            // 4. Realizar la actualización
            const { data: updatedUser, error } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .update(cambios)
                .eq('identificacion', identificacion)
                .select('identificacion, nombre, apellido, telefono, correo, descripcion, avatar')
                .single();

            if (error) {
                return {
                    status: false,
                    message: 'Error al actualizar el perfil: ' + error.message,
                    data: []
                };
            }

            return {
                status: true,
                message: "Usuario actualizado correctamente",
                data: [updatedUser]
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error inesperado al actualizar el perfil: ' + (error.message || 'Error desconocido'),
                data: []
            };
        }
    }


    // Actualiza el estado de un usuario
    async actualizarEstado(identificacion: number, dto: ActualizarEstadoUsuario) {
        const { data: usuarioActual, error: errorUsuario } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .select('identificacion, activo')
            .eq('identificacion', identificacion)
            .single();

        if (errorUsuario || !usuarioActual) {
            return {
                status: false,
                message: `No se encontró ningún usuario con la identificación ${identificacion}`,
                data: { activo: false }
            };
        }

        const { data: updatedUser, error } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .update({ activo: dto.activo })
            .eq('identificacion', identificacion)
            .select('activo')
            .single();

        if (error) {
            return {
                status: false,
                message: 'Error al actualizar el estado del usuario: ' + error.message,
                data: { activo: false }
            };
        }

        return {
            status: true,
            message: `Usuario ${dto.activo ? 'activado' : 'desactivado'} correctamente`,
            data: { activo: updatedUser.activo }
        };
    }

    // Elimina un usuario (propio usuario o superadmin)
    async delete(identificacion: number) {
        try {
            // 1. Verificar que el usuario existe
            const { data: usuarioActual, error: errorUsuario } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .select('identificacion, nombre, apellido')
                .eq('identificacion', identificacion)
                .single();

            if (errorUsuario || !usuarioActual) {
                return {
                    status: false,
                    message: `No se encontró ningún usuario con la identificación ${identificacion}`,
                    data: null
                };
            }

            // 2. Eliminar el usuario
            const { error } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .delete()
                .eq('identificacion', identificacion);

            if (error) {
                return {
                    status: false,
                    message: 'Error al eliminar el usuario: ' + error.message,
                    data: null
                };
            }

            return {
                status: true,
                message: `Usuario ${usuarioActual.nombre} ${usuarioActual.apellido} eliminado correctamente`,
                data: {
                    identificacion: usuarioActual.identificacion,
                    nombre: usuarioActual.nombre,
                    apellido: usuarioActual.apellido
                }
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error inesperado al eliminar el usuario: ' + (error.message || 'Error desconocido'),
                data: null
            };
        }
    }

    async findAllUsuariosAreas() {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('usuario_area')
            .select(`
                usuario_id,
                usuarios:usuario_id!inner (
                    id,
                    identificacion,
                    nombre,
                    apellido,
                    correo,
                    telefono,
                    avatar,
                    activo
                ),
                area:area_id!inner (
                    id,
                    nombre,
                    descripcion
                )
            `)
            .order('usuario_id', { ascending: true });

        if (error) {
            throw new InternalServerErrorException('Error al obtener usuarios con áreas: ' + error.message);
        }

        return {
            status: true,
            message: 'Usuarios con áreas obtenidos correctamente',
            data: data
        }
    }

}

