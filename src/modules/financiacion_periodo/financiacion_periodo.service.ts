import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { FinanciacionPeriodoRequest, FinanciacionPeriodoResponse } from './dto/financiacion_periodo.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class FinanciacionPeriodoService {
    constructor(private supabaseService: SupabaseService) {}

    // Obtiene todos los registros de financiacion_periodo
    async findAll(): Promise<FinanciacionPeriodoResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .select('*');

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener financiación por periodo: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Financiación por periodo encontrada',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al obtener financiación por periodo',
                error: error.message,
                data: [],
            };
        }
    }

    // Obtiene un registro de financiacion_periodo por su id
    async findOne(id: number): Promise<FinanciacionPeriodoResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener financiación por periodo: ' + error.message,
                );
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe una financiación por periodo con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],
                };
            }

            return {
                status: true,
                message: 'Financiación por periodo encontrada',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al obtener financiación por periodo',
                error: error.message,
                data: [],
            };
        }
    }

    // Crea un nuevo registro de financiacion_periodo
    async create(createRequest: FinanciacionPeriodoRequest): Promise<FinanciacionPeriodoResponse> {
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

            // Verificar duplicados (misma fuente, meta y periodo)
            const { data: duplicateCheck, error: duplicateError } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .select('id')
                .eq('fuente_id', createRequest.fuente_id)
                .eq('meta_id', createRequest.meta_id)
                .eq('periodo', createRequest.periodo)
                .limit(1);

            if (duplicateError) {
                throw new InternalServerErrorException(
                    'Error al verificar duplicados: ' + duplicateError.message,
                );
            }

            if (duplicateCheck.length > 0) {
                return {
                    status: false,
                    message: 'Ya existe un registro con la misma fuente, meta y periodo',
                    error: 'Registro duplicado',
                    data: [],
                };
            }

            // Crear el registro
            const { data, error } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .insert(createRequest)
                .single();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al crear financiación por periodo: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Financiación por periodo creada correctamente',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;

            return {
                status: false,
                message: 'Error al crear financiación por periodo',
                error: error.message,
                data: [],
            };
        }
    }

    // Actualiza un registro de financiacion_periodo
    async update(id: number, updateRequest: FinanciacionPeriodoRequest): Promise<FinanciacionPeriodoResponse> {
        try {
            // Verificar si el registro existe
            const { data: existingData, error: existingError } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (existingError) {
                throw new InternalServerErrorException(
                    'Error al validar financiación por periodo: ' + existingError.message
                );
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe una financiación por periodo con el ID ${id}`,
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
                existingData.periodo === updateRequest.periodo &&
                existingData.fuente_financiacion === updateRequest.fuente_financiacion &&
                existingData.valor === updateRequest.valor
            ) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la financiación por periodo',
                    error: 'Sin cambios',
                    data: existingData,
                };
            }

            // Verificar duplicados si se cambian los campos clave
            if (existingData.fuente_id !== updateRequest.fuente_id || 
                existingData.meta_id !== updateRequest.meta_id ||
                existingData.periodo !== updateRequest.periodo) {
                
                const { data: duplicateCheck, error: duplicateError } = await this.supabaseService.clientAdmin
                    .from('financiacion_periodo')
                    .select('id')
                    .eq('fuente_id', updateRequest.fuente_id)
                    .eq('meta_id', updateRequest.meta_id)
                    .eq('periodo', updateRequest.periodo)
                    .neq('id', id)
                    .limit(1);

                if (duplicateError) {
                    throw new InternalServerErrorException(
                        'Error al verificar duplicados: ' + duplicateError.message,
                    );
                }

                if (duplicateCheck.length > 0) {
                    return {
                        status: false,
                        message: 'Ya existe un registro con la misma fuente, meta y periodo',
                        error: 'Registro duplicado',
                        data: [],
                    };
                }
            }

            // Actualizar el registro
            const { data: updatedData, error: updateError } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .update({
                    fuente_id: updateRequest.fuente_id,
                    meta_id: updateRequest.meta_id,
                    periodo: updateRequest.periodo,
                    fuente_financiacion: updateRequest.fuente_financiacion,
                    valor: updateRequest.valor,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select('*')
                .single();

            if (updateError) {
                throw new InternalServerErrorException(
                    'Error al actualizar financiación por periodo: ' + updateError.message,
                );
            }

            return {
                status: true,
                message: 'Financiación por periodo actualizada correctamente',
                data: updatedData,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al actualizar financiación por periodo',
                error: error.message,
                data: [],
            };
        }
    }

    // Elimina un registro de financiacion_periodo
    async delete(id: number): Promise<FinanciacionPeriodoResponse> {
        try {
            // Verificar si el registro existe
            const { data, error } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al verificar financiación por periodo: ' + error.message
                );
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe una financiación por periodo con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],   
                };
            }

            // Eliminar el registro
            const { error: deleteError } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw new InternalServerErrorException(
                    'Error al eliminar financiación por periodo: ' + deleteError.message,
                );
            }

            return {
                status: true,
                message: `Financiación por periodo ID ${id} ha sido eliminada correctamente`,
                data: [],
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al eliminar financiación por periodo',
                error: error.message,
                data: [],
            };
        }
    }
}