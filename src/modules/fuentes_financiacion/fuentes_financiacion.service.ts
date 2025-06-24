import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { FuentesFinanciacionRequest, FuentesFinanciacionResponse } from './dto/fuentes_financiacion';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class FuentesFinanciacionService {
    constructor(private supabaseService: SupabaseService) {}

    //Obtiene todas las fuentes de financiación
    async findAll(): Promise<FuentesFinanciacionResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .select('*');

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener fuentes de financiación: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Fuentes de financiación encontradas',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al obtener fuentes de financiación',
                error: error.message,
                data: [],
            };
        }
    }

    //Obtiene una fuente de financiación por su id
    async findOne(id: number): Promise<FuentesFinanciacionResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener fuente de financiación: ' + error.message,
                );
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe una fuente de financiación con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],
                };
            }

            return {
                status: true,
                message: 'Fuente de financiación encontrada',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al obtener fuente de financiación',
                error: error.message,
                data: [],
            };
        }
    }

    //Crea una nueva fuente de financiación
    async create(createRequest: FuentesFinanciacionRequest): Promise<FuentesFinanciacionResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .insert(createRequest)
                .single();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al crear fuente de financiación: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Fuente de financiación creada correctamente',
                data: data,
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;

            return {
                status: false,
                message: 'Error al crear fuente de financiación',
                error: error.message,
                data: [],
            };
        }
    }   

    //Actualiza una fuente de financiación
    async update(id: number, updateRequest: FuentesFinanciacionRequest): Promise<FuentesFinanciacionResponse> {
        try {
            //Verifica si la fuente de financiación existe
            const { data: existingData, error: existingError } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (existingError) {
                throw new InternalServerErrorException(
                    'Error al validar fuente de financiación: '
                );
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe una fuente de financiación con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],
                };
            }

            //Verifica si hay cambios en la fuente de financiación
            if (existingData.nombre === updateRequest.nombre && 
                existingData.descripcion === updateRequest.descripcion
            ) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la fuente de financiación',
                    error: 'Sin cambios',
                    data: existingData,
                };
            }

            //Actualiza la fuente de financiación
            const { data: updatedData, error: updateError } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .update({
                    nombre: updateRequest.nombre,
                    descripcion: updateRequest.descripcion,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .single();

            if (updateError) {
                throw new InternalServerErrorException(
                    'Error al actualizar fuente de financiación: ' + updateError.message,
                );
            }

            return {
                status: true,
                message: 'Fuente de financiación actualizada correctamente',
                data: updatedData,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al actualizar fuente de financiación',
                error: error.message,
                data: [],
            };
        }
    }

    //Elimina una fuente de financiación
    async delete(id: number): Promise<FuentesFinanciacionResponse> {
        try {
            //Verifica si la fuente de financiación existe
            const { data, error } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al verificar fuente de financiación'
                );
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe una fuente de financiación con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],   
                };
            }

            //Verifica si la fuente de financiación está siendo usada en financiacion periodo
            const { data: financiacionPeriodo, error: financiacionPeriodoError } = await this.supabaseService.clientAdmin
                .from('financiacion_periodo')
                .select('id')
                .eq('fuente_id', id)
                .limit(1);

            if (financiacionPeriodoError) {
                throw new InternalServerErrorException(
                    'Error al verificar uso de la fuente de financiación'
                );
            }

            if (financiacionPeriodo.length > 0) {
                return {
                    status: false,
                    message: 'No se puede eliminar la fuente de financiación porque está siendo usada en financiación por periodo',
                    error: 'Fuente de financiación en uso',
                    data: [],
                };
            }
            
            //Elimina la fuente de financiación
            const { error: deleteError } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .delete()
                .eq('id', id)
                .single();

            if (deleteError) {
                throw new InternalServerErrorException(
                    'Error al eliminar fuente de financiación: ' + deleteError.message,
                );
            }

            return {
                status: true,
                message: `Fuente de financiación ${data.nombre} ha sido eliminada correctamente`,
                data: [],
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            return {
                status: false,
                message: 'Error al eliminar fuente de financiación',
                error: error.message,
                data: [],
            };
        }
    }
}
