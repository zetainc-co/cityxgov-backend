import {
    MetaResultadoRequest,
    FindAllMetaResultadosResponse,
    MetaResultado,
    MetaResultadoResponse
} from './dto/meta_resultado.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MetaResultadoService {
    constructor(private supabaseService: SupabaseService) {}

    async findAll(): Promise<FindAllMetaResultadosResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('*');
            if (error) {
                throw new InternalServerErrorException('Error al obtener metas de resultado: ' + error.message);
            }
            return {
                status: true,
                message: 'Metas de resultado encontradas',
                data: data as MetaResultado[],
                error: null,
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al obtener metas de resultado',
                error: error.message,
                data: []
            }
        }
    }

    async findOne(id: number): Promise<MetaResultadoResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (error) {
                throw new InternalServerErrorException('Error al buscar meta de resultado: ' + error.message);
            }
            if (!data) {
                return {
                    status: false,
                    message: `No existe una meta de resultado con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }
            return {
                status: true,
                message: 'Meta de resultado encontrada',
                data: [data as MetaResultado]
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al buscar meta de resultado',
                error: error.message,
                data: []
            }
        }
    }

    async create(createRequest: MetaResultadoRequest): Promise<MetaResultadoResponse> {
        try {
            // Validar si la meta de resultado existe
            const { data: existingMetaResultado, error: metaResultadoError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('id')
                .eq('nombre', createRequest.nombre)
                .maybeSingle();

            if (metaResultadoError) {
                throw new InternalServerErrorException('Error al validar nombre de meta resultado');
            }
            if (existingMetaResultado) {
                return {
                    status: false,
                    message: 'Ya existe una meta de resultado con este nombre',
                    error: 'Nombre duplicado',
                    data: []
                }
            }

            // Crear meta de resultado
            const { data, error } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .insert([{
                    nombre: createRequest.nombre.trim(),
                    indicador: createRequest.indicador.trim(),
                    linea_base: createRequest.linea_base.trim(),
                    año_linea_base: createRequest.año_linea_base,
                    meta_cuatrienio: createRequest.meta_cuatrienio.trim(),
                    fuente: createRequest.fuente.trim(),
                    linea_estrategica_id: createRequest.linea_estrategica_id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select('id, nombre, indicador, linea_base, año_linea_base, meta_cuatrienio, fuente, linea_estrategica_id, created_at, updated_at')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear meta de resultado: ' + error.message);
            }

            // const metaResultadoCreated: MetaResultado = {
            //     id: data.id,
            //     nombre: data.nombre,
            //     indicador: data.indicador,
            //     linea_base: data.linea_base,
            //     año_linea_base: data.año_linea_base,
            //     meta_cuatrienio: data.meta_cuatrienio,
            //     fuente: data.fuente,
            //     linea_estrategica_id: data.linea_estrategica_id,
            //     created_at: data.created_at,
            //     updated_at: data.updated_at
            // }

            return {
                status: true,
                message: 'Meta de resultado creada correctamente',
                data: [data as unknown as MetaResultado]
            };

        } catch (error) {
            return {
                status: false,
                message: 'Error al crear meta de resultado',
                error: error.message,
                data: []
            }
        }
    }

    async update(id: number, updateRequest: MetaResultadoRequest): Promise<MetaResultadoResponse> {
        try {
            // Obtener actual
            const { data: current, error: currError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (currError) {
                throw new InternalServerErrorException('Error al validar meta de resultado');
            }

            if (!current) {
                return {
                    status: false,
                    message: `No existe una meta de resultado con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }
            // Validar si el nombre ya existe en otro registro
            const { data: duplicateName, error: nameError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('id')
                .eq('nombre', updateRequest.nombre)
                .neq('id', id)
                .maybeSingle();

            if (nameError) {
                throw new InternalServerErrorException('Error al validar nombre duplicado');
            }
            if (duplicateName) {
                return {
                    status: false,
                    message: 'Ya existe una meta de resultado con este nombre',
                    error: 'Nombre duplicado',
                    data: []
                }
            }
            // Verificar cambios
            const hasChanges =
                current.nombre !== updateRequest.nombre.trim() ||
                current.indicador !== updateRequest.indicador.trim() ||
                current.linea_base !== updateRequest.linea_base.trim() ||
                current.año_linea_base !== updateRequest.año_linea_base ||
                current.meta_cuatrienio !== updateRequest.meta_cuatrienio.trim() ||
                current.fuente !== updateRequest.fuente.trim() ||
                current.linea_estrategica_id !== updateRequest.linea_estrategica_id;

            if (!hasChanges) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la meta de resultado',
                    error: 'Sin cambios',
                    data: [current as MetaResultado]
                }
            }

            // Actualizar
            const { data, error } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .update({
                    nombre: updateRequest.nombre.trim(),
                    indicador: updateRequest.indicador.trim(),
                    linea_base: updateRequest.linea_base.trim(),
                    meta_cuatrienio: updateRequest.meta_cuatrienio.trim(),
                    fuente: updateRequest.fuente.trim(),
                    linea_estrategica_id: updateRequest.linea_estrategica_id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar meta de resultado: ' + error.message);
            }

            return {
                status: true,
                message: 'Meta de resultado actualizada correctamente',
                data: [data as MetaResultado]
            };

        } catch (error) {
            return {
                status: false,
                message: 'Error al actualizar meta de resultado',
                error: error.message,
                data: []
            }
        }
    }

    async delete(id: number): Promise<MetaResultadoResponse> {
        try {
            // Verificar existencia
            const { data: existing, error: existError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('id')
                .eq('id', id)
                .maybeSingle();
            if (existError) {
                throw new InternalServerErrorException('Error al verificar meta de resultado: ' + existError.message);
            }
            if (!existing) {
                return {
                    status: false,
                    message: `No existe una meta de resultado con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }
            // Eliminar
            const { error } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .delete()
                .eq('id', id);
            if (error) {
                throw new InternalServerErrorException('Error al eliminar meta de resultado: ' + error.message);
            }
            return {
                status: true,
                message: 'Meta de resultado eliminada correctamente',
                data: []
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al eliminar meta de resultado',
                error: error.message,
                data: []
            }
        }
    }
}
