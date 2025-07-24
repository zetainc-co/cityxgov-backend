import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ProgramacionFisicaRequest, ProgramacionFisicaResponse } from './dto/programacion_fisica.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class ProgramacionFisicaService {

    constructor(private supabaseService: SupabaseService) { }

    // Obtiene todas las programaciones físicas
    async findAll(): Promise<ProgramacionFisicaResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .select('*')

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener programacion física: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Programacion física encontrada',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al obtener programacion física',
                data: [],
                error: error.message,
            };
        }
    }

    // Obtiene una programacion física por su id
    async findOne(id: number): Promise<ProgramacionFisicaResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener programacion física: ' + error.message,
                );
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe una programacion física con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],
                };
            }

            return {
                status: true,
                message: 'Programacion física encontrada',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al obtener programacion física',
                data: [],
                error: error.message,
            };
        }
    }

    // Crea una nueva programacion física
    async create(createRequest: ProgramacionFisicaRequest): Promise<ProgramacionFisicaResponse> {
        try {
            // Verificar que la meta producto existe
            const { data: metaExists, error: metaError } = await this.supabaseService.clientAdmin
                .from('meta_producto')
                .select('id, nombre')
                .eq('id', createRequest.meta_id)
                .single();

            if (metaError || !metaExists) {
                return {
                    status: false,
                    message: `No existe una meta producto con el ID ${createRequest.meta_id}`,
                    error: 'Meta producto no encontrada',
                    data: [],
                };
            }

            // Verificar que no exista ya una programación física para esta meta
            const { data: existingRecord, error: checkError } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .select('id')
                .eq('meta_id', createRequest.meta_id)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
                throw new InternalServerErrorException(
                    'Error al verificar duplicados: ' + checkError.message,
                );
            }

            if (existingRecord) {
                return {
                    status: false,
                    message: `Ya existe una programación física para la meta ${metaExists.nombre}`,
                    error: 'Meta duplicada',
                    data: [],
                };
            }

            // Calcular el total del cuatrienio
            const totalCuatrienio = createRequest.periodo_2024 + createRequest.periodo_2025 + createRequest.periodo_2026 + createRequest.periodo_2027;

            // Crear el registro con el total_cuatrienio calculado
            const { data, error } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .insert({
                    ...createRequest,
                    total_cuatrienio: totalCuatrienio
                })
                .select('*')
                .single();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al crear programacion física: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Programacion física creada correctamente',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;

            return {
                status: false,
                message: 'Error al crear programacion física',
                error: error.message,
                data: [],
            };
        }
    }

    // Actualiza una programacion física
    async update(id: number, updateRequest: ProgramacionFisicaRequest): Promise<ProgramacionFisicaResponse> {
        try {
            // Verificar que la programacion física existe
            const { data: existingData, error: existingError } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (existingError) {
                throw new InternalServerErrorException(
                    'Error al validar programacion física: ' + existingError.message,
                );
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe una programacion física con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],
                };
            }

            // Verificar que la meta producto existe
            const { data: metaExists, error: metaError } = await this.supabaseService.clientAdmin
                .from('meta_producto')
                .select('id, nombre')
                .eq('id', updateRequest.meta_id)
                .single();

            if (metaError || !metaExists) {
                return {
                    status: false,
                    message: `No existe una meta producto con el ID ${updateRequest.meta_id}`,
                    error: 'Meta producto no encontrada',
                    data: [],
                };
            }

            // Calcular el total del cuatrienio para la comparación
            const newTotalCuatrienio = updateRequest.periodo_2024 + updateRequest.periodo_2025 + updateRequest.periodo_2026 + updateRequest.periodo_2027;

            // Verificar si hay cambios
            if (existingData.meta_id === updateRequest.meta_id &&
                existingData.periodo_2024 === updateRequest.periodo_2024 &&
                existingData.periodo_2025 === updateRequest.periodo_2025 &&
                existingData.periodo_2026 === updateRequest.periodo_2026 &&
                existingData.periodo_2027 === updateRequest.periodo_2027 &&
                existingData.total_cuatrienio === newTotalCuatrienio
            ) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la programacion física',
                    error: 'Sin Cambios',
                    data: existingData,
                };
            }

            // Verificar que no exista ya otra programación física para esta meta (si cambió)
            if (existingData.meta_id !== updateRequest.meta_id) {
                const { data: duplicateCheck, error: duplicateError } = await this.supabaseService.clientAdmin
                    .from('programacion_fisica')
                    .select('id')
                    .eq('meta_id', updateRequest.meta_id)
                    .neq('id', id)
                    .maybeSingle();

                if (duplicateError && duplicateError.code !== 'PGRST116') {
                    throw new InternalServerErrorException(
                        'Error al verificar duplicados: ' + duplicateError.message,
                    );
                }

                if (duplicateCheck) {
                    return {
                        status: false,
                        message: `Ya existe una programación física para la meta ${metaExists.nombre}`,
                        error: 'Meta duplicada',
                        data: [],
                    };
                }
            }

            // Calcular el total del cuatrienio para la actualización
            const totalCuatrienio = updateRequest.periodo_2024 + updateRequest.periodo_2025 + updateRequest.periodo_2026 + updateRequest.periodo_2027;

            // Actualizar el registro con el total_cuatrienio calculado
            const { data: updatedData, error: updateError } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .update({
                    ...updateRequest,
                    total_cuatrienio: totalCuatrienio
                })
                .eq('id', id)
                .select('*')
                .single();

            if (updateError) {
                throw new InternalServerErrorException(
                    'Error al actualizar programacion física: ' + updateError.message,
                );
            }

            return {
                status: true,
                message: 'Programacion física actualizada correctamente',
                data: updatedData,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;

            return {
                status: false,
                message: 'Error al actualizar programacion física',
                error: error.message,
                data: [],
            };
        }
    }

    // Elimina una programacion física
    async delete(id: number): Promise<ProgramacionFisicaResponse> {
        try {
            // Verificar que la programacion física existe
            const { data: existingData, error: existingError } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (existingError) {
                throw new InternalServerErrorException(
                    'Error al validar programacion física: ' + existingError.message,
                );
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe una programacion física con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],
                };
            }

            // Eliminar el registro
            const { error: deleteError } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw new InternalServerErrorException(
                    'Error al eliminar programacion física: ' + deleteError.message,
                );
            }

            return {
                status: true,
                message: `Programacion física ID ${id} ha sido eliminada correctamente`,
                data: [],
            };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;

            return {
                status: false,
                message: 'Error al eliminar programacion física',
                error: error.message,
                data: [],
            };
        }
    }
}
