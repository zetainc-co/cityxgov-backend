import {
    MetaResultadoRequest,
    MetaResultado,
    MetaResultadoResponse
} from './dto/meta_resultado.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MetaResultadoService {
    constructor(private supabaseService: SupabaseService) {}

    //Obtener todas las metas de resultado
    async findAll(): Promise<MetaResultadoResponse> {
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
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener metas de resultado',
                error: error.message,
                data: []
            }
        }
    }

    //Obtener una meta de resultado
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
                data: data
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

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
            // 1. Validar que existe la línea estratégica
            const { data: lineaEstrategica, error: lineaError } = await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('id')
                .eq('id', createRequest.linea_estrategica_id)
                .maybeSingle();

            if (lineaError) {
                throw new InternalServerErrorException('Error al validar línea estratégica: ' + lineaError.message);
            }

            if (!lineaEstrategica) {
                return {
                    status: false,
                    message: `No existe una línea estratégica con el ID ${createRequest.linea_estrategica_id}`,
                    error: 'Línea estratégica no encontrada',
                    data: []
                }
            }

            // 2. Validar si la meta de resultado existe
            const { data: existingMetaResultado, error: metaResultadoError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('id')
                .eq('nombre', createRequest.nombre.trim())
                .maybeSingle();

            if (metaResultadoError) {
                throw new InternalServerErrorException('Error al validar nombre de meta resultado: ' + metaResultadoError.message);
            }

            if (existingMetaResultado) {
                return {
                    status: false,
                    message: 'Ya existe una meta de resultado con este nombre',
                    error: 'Nombre duplicado',
                    data: []
                }
            }

            // 3. Crear meta de resultado
            const { data, error } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .insert({
                    nombre: createRequest.nombre.trim(),
                    indicador: createRequest.indicador.trim(),
                    linea_base: createRequest.linea_base.trim(),
                    año_linea_base: createRequest.año_linea_base,
                    meta_cuatrienio: createRequest.meta_cuatrienio.trim(),
                    fuente: createRequest.fuente.trim(),
                    linea_estrategica_id: createRequest.linea_estrategica_id,
                })
                .select('*')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear meta de resultado: ' + error.message);
            }

            return {
                status: true,
                message: 'Meta de resultado creada correctamente',
                data: data
            };

        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

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
            // 1. Obtener actual
            const { data: current, error: currError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (currError) {
                throw new InternalServerErrorException('Error al verificar meta de resultado: ' + currError.message);
            }

            if (!current) {
                return {
                    status: false,
                    message: `No existe una meta de resultado con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            // 2. Validar que existe la línea estratégica
            const { data: lineaEstrategica, error: lineaError } = await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('id')
                .eq('id', updateRequest.linea_estrategica_id)
                .maybeSingle();

            if (lineaError) {
                throw new InternalServerErrorException('Error al validar línea estratégica: ' + lineaError.message);
            }

            if (!lineaEstrategica) {
                return {
                    status: false,
                    message: `No existe una línea estratégica con el ID ${updateRequest.linea_estrategica_id}`,
                    error: 'Línea estratégica no encontrada',
                    data: []
                }
            }

            // 3. Validar si el nombre ya existe en otro registro
            const { data: duplicateName, error: nameError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('id')
                .eq('nombre', updateRequest.nombre.trim())
                .neq('id', id)
                .maybeSingle();

            if (nameError) {
                throw new InternalServerErrorException('Error al validar nombre duplicado: ' + nameError.message);
            }

            if (duplicateName) {
                return {
                    status: false,
                    message: 'Ya existe una meta de resultado con este nombre',
                    error: 'Nombre duplicado',
                    data: []
                }
            }

            // 4. Verificar cambios
            if (
                current.nombre === updateRequest.nombre.trim() &&
                current.indicador === updateRequest.indicador.trim() &&
                current.linea_base === updateRequest.linea_base.trim() &&
                current.año_linea_base === updateRequest.año_linea_base &&
                current.meta_cuatrienio === updateRequest.meta_cuatrienio.trim() &&
                current.fuente === updateRequest.fuente.trim() &&
                current.linea_estrategica_id === updateRequest.linea_estrategica_id
            ) {  
                return {
                    status: false,
                    message: 'No se detectaron cambios en la meta de resultado',
                    error: 'Sin cambios',
                    data: current
                }
            }
            // 5. Actualizar
            const { data, error } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .update({
                    nombre: updateRequest.nombre.trim(),
                    indicador: updateRequest.indicador.trim(),
                    linea_base: updateRequest.linea_base.trim(),
                    año_linea_base: updateRequest.año_linea_base,
                    meta_cuatrienio: updateRequest.meta_cuatrienio.trim(),
                    fuente: updateRequest.fuente.trim(),
                    linea_estrategica_id: updateRequest.linea_estrategica_id,
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
            if (error instanceof BadRequestException) {
                throw error;
            }

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
            // 1. Verificar si la meta de resultado existe
            const { data: existing, error: existError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('*')
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

            // 2. Verificar si está siendo usado en metas_resultado_producto
            const { data: metasProducto, error: metasError } = await this.supabaseService.clientAdmin
                .from('metas_resultado_producto')
                .select('meta_producto_id')
                .eq('meta_resultado_id', id)
                .limit(1);

            if (metasError) {
                throw new InternalServerErrorException(
                    'Error al verificar uso de la meta de resultado: ' + metasError.message,
                );
            }

            if (metasProducto && metasProducto.length > 0) {
                return {
                    status: false,
                    message: 'No se puede eliminar la meta de resultado porque está siendo usada en metas de producto',
                    error: 'Meta de resultado en uso',
                    data: []
                };
            }

            // 3. Eliminar
            const { error } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .delete()
                .eq('id', id);

            if (error) {
                throw new InternalServerErrorException('Error al eliminar meta de resultado: ' + error.message);
            }

            return {
                status: true,
                message: `Meta de resultado ${existing.nombre} ha sido eliminada correctamente`,
                data: []
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al eliminar meta de resultado',
                error: error.message,
                data: []
            }
        }
    }
}
