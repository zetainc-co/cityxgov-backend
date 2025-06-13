import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { CreateAreaRequest, AreaResponse, Area } from './dto/area.dto';

@Injectable()
export class AreaService {
    constructor(private supabaseService: SupabaseService) { }

    // Obtiene todas las áreas
    async findAll(): Promise<AreaResponse> {
        try {
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('area')
                    .select('id, nombre, descripcion, created_at, updated_at')
                    .order('created_at', { ascending: false });

            if (error) {
                throw new InternalServerErrorException('Error al obtener áreas: ' + error.message);
            }

            return {
                status: true,
                message: 'Áreas encontradas correctamente',
                data: data as Area[]
            };
        } catch (error) {
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
                .select('id, nombre, descripcion, created_at, updated_at')
                .eq('id', id)
                .single();

            if (!data) {
                return {
                    status: false,
                    message: `No existe una área con el ID ${id}`,
                    error: 'ID no encontrado'
                }
            }

            if (error) {
                throw new InternalServerErrorException('Error al obtener área: ' + error);
            }

            const area: Area = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return {
                status: true,
                message: 'Área encontrada correctamente',
                data: [area]
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al obtener área',
                error: error.message
            };
        }
    }

    // Crea una nueva área
    async create(createRequest: CreateAreaRequest): Promise<AreaResponse> {
        try {
            // Validar si el nombre ya existe
            const { data: existingLinea, error: validationError } =
            await this.supabaseService.clientAdmin
            .from('area')
            .select('id')
            .eq('nombre', createRequest.area.nombre)
            .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de área');
            }

            if (existingLinea) {
                return {
                    status: false,
                    message: 'Ya existe una área con este nombre',
                    error: 'Nombre duplicado'
                }
            }

            // Crea la área
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('area')
                    .insert([{
                        nombre: createRequest.area.nombre,
                        descripcion: createRequest.area.descripcion || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select('id, nombre, descripcion, created_at, updated_at')
                    .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear área: ' + error.message);
            }

            const areaData: Area = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return {
                status: true,
                message: 'Área creada correctamente',
                data: [areaData]
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al crear área',
                error: error.message
            };
        }
    }

    // Actualiza una área
    async update(id: number, createRequest: CreateAreaRequest): Promise<AreaResponse> {
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
                    error: 'ID no encontrado'
                }
            }

            // Validar si el nombre ya existe
            const { data: existingLinea, error: validationError } =
            await this.supabaseService.clientAdmin
            .from('area')
            .select('id')
            .eq('nombre', createRequest.area.nombre)
            .neq('id', id)
            .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de área');
            }

            if (existingLinea) {
                return {
                    status: false,
                    message: 'Ya existe otra área con este nombre',
                    error: 'Nombre duplicado'
                }
            }

            // Verificar si hay cambios
            const hasChanges =
                existingData.nombre !== createRequest.area.nombre ||
                existingData.descripcion !== createRequest.area.descripcion;

            if (!hasChanges) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la área',
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

            // Actualiza la área
            const { data, error } = await this.supabaseService.clientAdmin
                .from('area')
                .update({
                    nombre: createRequest.area.nombre,
                    descripcion: createRequest.area.descripcion,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('id, nombre, descripcion, created_at, updated_at')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar área: ' + error.message);
            }

            const updatedArea: Area = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return {
                status: true,
                message: 'Área actualizada correctamente',
                data: [updatedArea]
            };
        } catch (error) {
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
                    error: 'ID no encontrado'
                }
            }

            // Elimina la área
            const { error } = await this.supabaseService.clientAdmin
                .from('area')
                .delete()
                .eq('id', id);

            if (error) {
                throw new InternalServerErrorException('Error al eliminar área: ' + error.message);
            }

            return {
                status: true,
                message: 'Área eliminada correctamente',
                data: []
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al eliminar área',
                error: error.message
            };
        }
    }
}
