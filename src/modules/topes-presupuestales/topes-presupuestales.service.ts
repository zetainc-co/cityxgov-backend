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

    // Obtiene todos los topes presupuestales
    async findAll(): Promise<TopesPresupuestalesResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .select(`
          *,
          fuentes_financiacion(*)
        `)
                .order('año', { ascending: false });

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener topes presupuestales: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Topes presupuestales encontrados correctamente',
                data: data,
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

    // Obtiene topes por año
    async findByAño(año: number): Promise<TopesPresupuestalesResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .select(`
                    *,
                    fuentes_financiacion(*)
                `)
                .eq('año', año)
                .order('fuente_id', { ascending: true });

            if (error) {
                throw new InternalServerErrorException(
                    'Error al obtener topes presupuestales: ' + error.message,
                );
            }

            return {
                status: true,
                message: 'Topes presupuestales encontrados correctamente',
                data: data,
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

    // Obtiene un tope por su ID
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
                createRequest.año,
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
                        message: 'Ya existe un tope presupuestal para esta fuente y año',
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
                updateRequest.año,
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



    // Obtiene todas las fuentes de financiación con información de topes para un año específico
    async getFuentesConTopes(año: number): Promise<TopesPresupuestalesResponse> {
        try {
            // Obtener todas las fuentes de financiación
            const { data: fuentes, error: fuentesError } = await this.supabaseService.clientAdmin
                .from('fuentes_financiacion')
                .select('*')
                .order('nombre', { ascending: true });

            if (fuentesError) {
                throw new InternalServerErrorException(
                    'Error al obtener fuentes de financiación: ' + fuentesError.message,
                );
            }

            // Obtener los topes existentes para el año especificado
            const { data: topes, error: topesError } = await this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .select(`
                    fuente_id,
                    tope_maximo,
                    descripcion
                `)
                .eq('año', año);

            if (topesError) {
                throw new InternalServerErrorException(
                    'Error al obtener topes presupuestales: ' + topesError.message,
                );
            }

            // Crear un mapa de topes por fuente_id para búsqueda rápida
            const topesMap = new Map();
            topes?.forEach(tope => {
                topesMap.set(tope.fuente_id, tope);
            });

            // Combinar fuentes con información de topes
            const fuentesConTopes = fuentes?.map(fuente => {
                const tope = topesMap.get(fuente.id);
                return {
                    ...fuente,
                    tiene_tope: !!tope,
                    tope_maximo: tope?.tope_maximo || null,
                    tope_descripcion: tope?.descripcion || null,
                    tope_id: tope ? tope.fuente_id : null
                };
            });

            return {
                status: true,
                message: `Fuentes de financiación para el año ${año}`,
                data: fuentesConTopes,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener fuentes con topes',
                error: error.message,
            };
        }
    }

    // Valida los datos antes de crear o actualizar un tope presupuestal
    private async validateTopePresupuestal(
        fuenteId: number,
        año: number,
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

            // 3. Validar que no haya duplicados (misma fuente + mismo año)
            let query = this.supabaseService.clientAdmin
                .from('topes_presupuestales')
                .select('id')
                .eq('fuente_id', fuenteId)
                .eq('año', año);

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
                    message: 'Ya existe un tope presupuestal para esta fuente de financiación y año',
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
