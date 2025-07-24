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
            // Verificar que la fuente de financiación existe
            const { data: fuenteExists, error: fuenteError } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .select('id, nombre')
                .eq('id', createRequest.fuente_id)
                .single();

            if (fuenteError || !fuenteExists) {
                return {
                    status: false,
                    message: `No existe una fuente de financiación con el ID ${createRequest.fuente_id}`,
                    error: 'Fuente de financiación no encontrada',
                    data: [],
                };
            }

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

            // Verificar que no exista ya una combinación fuente_id + meta_id
            // const {data: existingRecord, error: checkError} = await this.supabaseService.clientAdmin
            // .from('programacion_fisica')
            // .select('id')
            // .eq('fuente_id', createRequest.fuente_id)
            // .eq('meta_id', createRequest.meta_id)
            // .maybeSingle();

            // if (checkError && checkError) {
            //     throw new InternalServerErrorException(
            //         'Error al verificar duplicados: ' + checkError.message,
            //     );
            // }

            // if (existingRecord) {
            //     return {
            //         status: false,
            //         message: `Ya existe una programación física para la fuente ${fuenteExists.nombre} y la meta ${metaExists.nombre}`,
            //         error: 'Combinación duplicada',
            //         data: [],
            //     };
            // }

            // Crear el registro
            const { data, error } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .insert(createRequest)
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

            // Verificar que la fuente de financiación existe
            const { data: fuenteExists, error: fuenteError } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .select('id, nombre')
                .eq('id', updateRequest.fuente_id)
                .single();

            if (fuenteError || !fuenteExists) {
                return {
                    status: false,
                    message: `No existe una fuente de financiación con el ID ${updateRequest.fuente_id}`,
                    error: 'Fuente de financiación no encontrada',
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

            // Verificar si hay cambios
            if (existingData.fuente_id === updateRequest.fuente_id &&
                existingData.meta_id === updateRequest.meta_id &&
                existingData.periodo_2024 === updateRequest.periodo_2024 &&
                existingData.periodo_2025 === updateRequest.periodo_2025 &&
                existingData.periodo_2026 === updateRequest.periodo_2026 &&
                existingData.periodo_2027 === updateRequest.periodo_2027
            ) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la programacion física',
                    error: 'Sin Cambios',
                    data: existingData,
                };
            }

            // Verificar que no exista ya otra combinación fuente_id + meta_id (si cambió)
            // if (existingData.fuente_id !== updateRequest.fuente_id || existingData.meta_id !== updateRequest.meta_id) {
            //     const {data: duplicateCheck, error: duplicateError} = await this.supabaseService.clientAdmin
            //     .from('programacion_fisica')
            //     .select('id')
            //     .eq('fuente_id', updateRequest.fuente_id)
            //     .eq('meta_id', updateRequest.meta_id)
            //     .neq('id', id)
            //     .maybeSingle();

            //     if (duplicateError && duplicateError.code !== 'PGRST116') {
            //         throw new InternalServerErrorException(
            //             'Error al verificar duplicados: ' + duplicateError.message,
            //         );
            //     }

            //     if (duplicateCheck) {
            //         return {
            //             status: false,
            //             message: `Ya existe una programación física para la fuente ${fuenteExists.nombre} y la meta ${metaExists.nombre}`,
            //             error: 'Combinación duplicada',
            //             data: [],
            //         };
            //     }
            // }

            // Actualizar el registro
            const { data: updatedData, error: updateError } = await this.supabaseService.clientAdmin
                .from('programacion_fisica')
                .update(updateRequest)
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
