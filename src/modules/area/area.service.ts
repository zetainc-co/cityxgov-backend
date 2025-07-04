import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { AreaResponse, Area, AreaRequest } from './dto/area.dto';

@Injectable()
export class AreaService {
    constructor(private supabaseService: SupabaseService) { }

    // Obtiene todas las áreas
    async findAll(): Promise<AreaResponse> {
        try {
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('area')
                    .select('*')
                    .order('created_at', { ascending: false });

            if (error) {
                throw new InternalServerErrorException('Error al obtener áreas: ' + error.message);
            }

            return {
                status: true,
                message: 'Áreas encontradas correctamente',
                data: data,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener áreas',
                error: error.message
            };
        }
    }

    // Obtiene una área por su ID
    async findOne(id: number): Promise<AreaResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('area')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException('Error al obtener área: ' + error.message);
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe una área con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }
            return {
                status: true,
                message: 'Área encontrada correctamente',
                data: data
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener área',
                error: error.message
            };
        }
    }

    // Crea una nueva área
    async create(createRequest: AreaRequest): Promise<AreaResponse> {
        try {
            // Validar si el nombre ya existe
            const { data: existingNombre, error: validationError } =
            await this.supabaseService.clientAdmin
            .from('area')
            .select('id')
            .eq('nombre', createRequest.nombre)
            .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de área');
            }

            if (existingNombre) {
                return {
                    status: false,
                    message: 'Ya existe una área con este nombre',
                    error: 'Nombre duplicado'
                }
            }

            // Validar si el teléfono ya existe
            if (createRequest.telefono && createRequest.telefono.trim().length > 0) {
                const { data: existingTelefono, error: telefonoValidationError } =
                await this.supabaseService.clientAdmin
                .from('area')
                .select('id')
                .eq('telefono', createRequest.telefono.trim())
                .maybeSingle();

                if (telefonoValidationError) {
                    throw new InternalServerErrorException('Error al validar teléfono de área');
                }

                if (existingTelefono) {
                    return {
                        status: false,
                        message: 'Ya existe una área con este número de teléfono',
                        error: 'Teléfono duplicado'
                    }
                }
            }

            // Crea la área
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('area')
                    .insert(createRequest)
                    .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear área: ' + error.message);
            }

            return {
                status: true,
                message: 'Área creada correctamente',
                data: data,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al crear área',
                error: error.message,
                data: []
            };
        }
    }

    // Actualiza una área
    async update(id: number, createRequest: AreaRequest): Promise<AreaResponse> {
        try {
            // Primero verificar si existe
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('area')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar área: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe una área con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            // Validar si el nombre ya existe
            const { data: existingNombre, error: validationError } =
            await this.supabaseService.clientAdmin
            .from('area')
            .select('id')
            .eq('nombre', createRequest.nombre)
            .neq('id', id)
            .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de área');
            }

            if (existingNombre) {
                return {
                    status: false,
                    message: 'Ya existe otra área con este nombre',
                    error: 'Nombre duplicado',
                    data: []
                }
            }

            // Validar si el teléfono ya existe (solo si se proporciona y es diferente al actual)
            if (createRequest.telefono && createRequest.telefono.trim().length > 0) {
                const { data: existingTelefono, error: telefonoValidationError } =
                await this.supabaseService.clientAdmin
                .from('area')
                .select('id')
                .eq('telefono', createRequest.telefono.trim())
                .neq('id', id)
                .maybeSingle();

                if (telefonoValidationError) {
                    throw new InternalServerErrorException('Error al validar teléfono de área');
                }

                if (existingTelefono) {
                    return {
                        status: false,
                        message: 'Ya existe otra área con este número de teléfono',
                        error: 'Teléfono duplicado',
                        data: []
                    }
                }
            }

            // Verificar si hay cambios
            if (
                existingData.nombre === createRequest.nombre &&
                existingData.descripcion === createRequest.descripcion &&
                existingData.telefono === createRequest.telefono &&
                existingData.correo === createRequest.correo &&
                existingData.direccion === createRequest.direccion &&
                existingData.responsable === createRequest.responsable
            ) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la área',
                    error: 'Sin cambios',
                    data: existingData
                }
            }

            // Actualiza la área
            const { data, error } = await this.supabaseService.clientAdmin
                .from('area')
                .update({
                    nombre: createRequest.nombre,
                    descripcion: createRequest.descripcion,
                    telefono: createRequest.telefono,
                    correo: createRequest.correo,
                    direccion: createRequest.direccion,
                    responsable: createRequest.responsable,
                })
                .eq('id', id)
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar área: ' + error.message);
            }

            return {
                status: true,
                message: 'Área actualizada correctamente',
                data: data,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al actualizar área',
                error: error.message
            };
        }
    }

    // Elimina una área
    async delete(id: number): Promise<AreaResponse> {
        try {
            // 1. Verificar si el área existe
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('area')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar área: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe una área con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            // 2. Verificar si está siendo usada en usuario_area
            const { data: usuariosArea, error: usuariosError } = await this.supabaseService.clientAdmin
                .from('usuario_area')
                .select('id, usuario_id')
                .eq('area_id', id)
                .limit(5);

            if (usuariosError) {
                throw new InternalServerErrorException(
                    'Error al verificar uso del área en usuario_area: ' + usuariosError.message,
                );
            }

            if (usuariosArea && usuariosArea.length > 0) {
                return {
                    status: false,
                    message: `No se puede eliminar el área porque está siendo usada por ${usuariosArea.length} usuario(s)`,
                    error: 'Área en uso por usuarios',
                    data: []
                };
            }

            // 3. Verificar si está siendo usada en meta_producto
            const { data: metasProducto, error: metasError } = await this.supabaseService.clientAdmin
                .from('meta_producto')
                .select('id')
                .eq('area_id', id)
                .limit(5);

            if (metasError) {
                throw new InternalServerErrorException(
                    'Error al verificar uso del área en meta_producto: ' + metasError.message,
                );
            }

            if (metasProducto && metasProducto.length > 0) {
                return {
                    status: false,
                    message: `No se puede eliminar el área porque está siendo usada por ${metasProducto.length} meta(s) producto`,
                    error: 'Área en uso por metas producto',
                    data: []
                };
            }

            // 4. Eliminar el área
            const { error } = await this.supabaseService.clientAdmin
                .from('area')
                .delete()
                .eq('id', id);

            if (error) {
                throw new InternalServerErrorException('Error al eliminar área: ' + error.message);
            }

            return {
                status: true,
                message: `Área ${existingData.nombre} ha sido eliminada correctamente`,
                data: []
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al eliminar área',
                error: error.message,
                data: []
            };
        }
    }
}
