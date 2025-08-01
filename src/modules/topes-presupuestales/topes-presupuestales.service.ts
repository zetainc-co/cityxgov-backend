import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase/supabase.service';
import {
    TopesPresupuestalesResponse,
    TopesPresupuestalesRequest,
    TopesPresupuestalesWithRelations
} from './dto/topes-presupuestales.dto';

@Injectable()
export class TopesPresupuestalesService {
    constructor(private supabaseService: SupabaseService) { }

    // Obtiene topes por periodo específico con relaciones
    async findByPeriodo(periodo: number): Promise<TopesPresupuestalesResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .select(`
                    *,
                    fuentes_financiacion(*)
                `)
                .eq('periodo', periodo)
                .order('fuente_id', { ascending: true });

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener topes presupuestales: ' + error.message,
                );
            }

            return {
                status: true,
                message: `Topes presupuestales del periodo ${periodo} encontrados correctamente`,
                data: data || [],
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener topes presupuestales',
                error: error.message,
            };
        }
    }

    // Obtiene un tope por su ID con relaciones
    async findOne(id: number): Promise<TopesPresupuestalesResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .select(`
                    *,
                    fuentes_financiacion(*)
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener tope presupuestal: ' + error.message,
                );
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe un tope presupuestal con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],
                };
            }

            return {
                status: true,
                message: 'Tope presupuestal encontrado correctamente',
                data: data,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener tope presupuestal',
                error: error.message,
            };
        }
    }

    // Crea un nuevo tope presupuestal
    async create(createRequest: TopesPresupuestalesRequest): Promise<TopesPresupuestalesResponse> {
        try {
            // Validar los datos antes de crear
            const validationResult = await this.validateTopePresupuestal(
                createRequest.fuente_id,
                createRequest.periodo,
                createRequest.tope_maximo
            );

            if (!validationResult.status) {
                return validationResult;
            }

            const { data, error } = await this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .insert(createRequest)
                .single();

            if (error) {
                if (error.code === '23505') {
                    return {
                        status: false,
                        message: 'Ya existe un tope presupuestal para esta fuente y periodo',
                        error: 'Tope duplicado',
                        data: [],
                    };
                }
                throw new InternalServerErrorException(
                    'Error al crear tope presupuestal: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Tope presupuestal creado correctamente',
                data: data,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al crear tope presupuestal',
                error: error.message,
            };
        }
    }

    // Actualiza un tope presupuestal
    async update(id: number, updateRequest: TopesPresupuestalesRequest): Promise<TopesPresupuestalesResponse> {
        try {
            // Validar los datos antes de actualizar
            const validationResult = await this.validateTopePresupuestal(
                updateRequest.fuente_id,
                updateRequest.periodo,
                updateRequest.tope_maximo,
                id // Excluir el registro actual de la validación de duplicados
            );

            if (!validationResult.status) {
                return validationResult;
            }

            const { data, error } = await this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .update(updateRequest)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new InternalServerErrorException(
                    'Error al actualizar tope presupuestal: ' + error.message,
                );
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe un tope presupuestal con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: [],
                };
            }

            return {
                status: true,
                message: 'Tope presupuestal actualizado correctamente',
                data: data,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al actualizar tope presupuestal',
                error: error.message,
            };
        }
    }

    // Elimina un tope presupuestal
    async delete(id: number): Promise<TopesPresupuestalesResponse> {
        try {
            const { error } = await this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .delete()
                .eq('id', id);

            if (error) {
                throw new InternalServerErrorException(
                    'Error al eliminar tope presupuestal: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Tope presupuestal eliminado correctamente',
                data: [],
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al eliminar tope presupuestal',
                error: error.message,
            };
        }
    }

    // Valida los datos antes de crear o actualizar un tope presupuestal
    private async validateTopePresupuestal(
        fuenteId: number,
        periodo: number,
        topeMaximo: number,
        excludeId?: number
    ): Promise<TopesPresupuestalesResponse> {
        try {
            // 1. Verificar que la fuente de financiación existe
            const { data: fuente, error: fuenteError } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .select('id')
                .eq('id', fuenteId)
                .maybeSingle();

            if (fuenteError) {
                throw new InternalServerErrorException(
                    'Error al validar fuente de financiación: ' + fuenteError.message,
                );
            }

            if (!fuente) {
                return {
                    status: false,
                    message: `No existe una fuente de financiación con el ID ${fuenteId}`,
                    error: 'Fuente de financiación no encontrada',
                    data: [],
                };
            }

            // 2. Validar que el tope_maximo sea positivo
            if (topeMaximo <= 0) {
                return {
                    status: false,
                    message: 'El tope máximo debe ser un valor positivo',
                    error: 'Tope máximo inválido',
                    data: [],
                };
            }

            // 3. Validar que no haya duplicados (misma fuente + mismo periodo)
            let query = this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .select('id')
                .eq('fuente_id', fuenteId)
                .eq('periodo', periodo);

            // Si estamos actualizando, excluir el registro actual
            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            const { data: existingTope, error: duplicateError } = await query.maybeSingle();

            if (duplicateError) {
                throw new InternalServerErrorException(
                    'Error al validar duplicados: ' + duplicateError.message,
                );
            }

            if (existingTope) {
                return {
                    status: false,
                    message: 'Ya existe un tope presupuestal para esta fuente de financiación y periodo',
                    error: 'Tope duplicado',
                    data: [],
                };
            }

            return {
                status: true,
                message: 'Validación exitosa',
                data: [],
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error en la validación',
                error: error.message,
            };
        }
    }
}
