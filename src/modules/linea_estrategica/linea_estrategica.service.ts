import {
    LineaEstrategica,
    LineaEstrategicaResponse,
    LineaEstrategicaRequest,
} from './dto/linea_estrategica.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class LineaEstrategicaService {
    constructor(private supabaseService: SupabaseService) {}

    // Obtiene todas las líneas estratégicas
    async findAll(): Promise<LineaEstrategicaResponse> {
        try {
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('linea_estrategica')
                    .select('*');

            if (error) {
                throw new InternalServerErrorException('Error al obtener líneas estratégicas: ' + error.message);
            }

            return {
                status: true,
                message: 'Líneas estratégicas encontradas',
                data: data as LineaEstrategica[],
                error: null,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener líneas estratégicas',
                error: error.message,
                data: []
            }
        }
    }

    // Obtiene una línea estratégica por su ID
    async findOne(id: number): Promise<LineaEstrategicaResponse> {
        try{
            const { data, error } =
            await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException('Error al buscar línea estratégica: ' + error.message);
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe una línea estratégica con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            return {
                status: true,
                message: 'Línea estratégica encontrada',
                data: data
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al buscar línea estratégica',
                error: error.message,
                data: []
            }
        }
    }

    //Crea una línea estratégica
    async create(createRequest: LineaEstrategicaRequest): Promise<LineaEstrategicaResponse> {
        try{
            // 1. Validar si el nombre ya existe
            const { data: existingLinea, error: validationError } =
                await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('id')
                .eq('nombre', createRequest.nombre.trim())
                .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de línea estratégica: ' + validationError.message);
            }

            if (existingLinea) {
                return {
                    status: false,
                    message: 'Ya existe una línea estratégica con este nombre',
                    error: 'Nombre duplicado',
                    data: []
                }
            }

            // 2. Crear la línea estratégica
            const { data, error } =
            await this.supabaseService.clientAdmin
            .from('linea_estrategica')
                .insert({
                    nombre: createRequest.nombre.trim(),
                    descripcion: createRequest.descripcion?.trim() || null,
                    plan_nacional: createRequest.plan_nacional.trim(),
                    plan_departamental: createRequest.plan_departamental.trim(),
                })
                .select('*')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear línea estratégica: ' + error.message);
            }

            return {
                status: true,
                message: 'Línea estratégica creada correctamente',
                data: data
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al crear línea estratégica',
                error: error.message,
                data: []
            }
        }
    }

    // Actualiza una línea estratégica
    async update(id: number, updateRequest: LineaEstrategicaRequest): Promise<LineaEstrategicaResponse> {
        try{
            // 1. Verificar si existe
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar línea estratégica: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe una línea estratégica con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            // 2. Validar si el nombre ya existe en otra línea estratégica
            const { data: existingLinea, error: validationError } =
                await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('id')
                .eq('nombre', updateRequest.nombre.trim())
                .neq('id', id)
                .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de línea estratégica: ' + validationError.message);
            }

            if (existingLinea) {
                return {
                    status: false,
                    message: 'Ya existe una línea estratégica con este nombre',
                    error: 'Nombre duplicado',
                    data: []
                }
            }

            // 3. Verificar si hay cambios
            if (
                existingData.nombre === updateRequest.nombre.trim() &&
                existingData.descripcion === updateRequest.descripcion?.trim() &&
                existingData.plan_nacional === updateRequest.plan_nacional.trim() &&
                existingData.plan_departamental === updateRequest.plan_departamental.trim()
            ) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la línea estratégica',
                    error: 'Sin cambios',
                    data: existingData
                }
            }

            // 4. Actualizar la línea estratégica
            const { data, error } =
            await this.supabaseService.clientAdmin
            .from('linea_estrategica')
            .update({
                nombre: updateRequest.nombre.trim(),
                descripcion: updateRequest.descripcion?.trim() || null,
                plan_nacional: updateRequest.plan_nacional.trim(),
                plan_departamental: updateRequest.plan_departamental.trim()
            })
            .eq('id', id)
            .select('*')
            .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar línea estratégica: ' + error.message);
            }

            return {
                status: true,
                message: 'Línea estratégica actualizada correctamente',
                data: data
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al actualizar línea estratégica',
                error: error.message,
                data: []
            }
        }
    }

    // Elimina una línea estratégica
    async delete(id: number): Promise<LineaEstrategicaResponse> {
        try{
            // 1. Verificar si la línea estratégica existe
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar línea estratégica: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: `No existe una línea estratégica con el ID ${id}`,
                    error: 'ID no encontrado',
                    data: []
                }
            }

            // 2. Verificar si está siendo usada por programas
            const { data: programasAsociados, error: programasError } = await this.supabaseService.clientAdmin
                .from('programa')
                .select('id, nombre')
                .eq('linea_estrategica_id', id)
                .limit(5);

            if (programasError) {
                throw new InternalServerErrorException('Error al verificar programas asociados: ' + programasError.message);
            }

            if (programasAsociados && programasAsociados.length > 0) {
                const nombres = programasAsociados.map(p => p.nombre).join(', ');
                return {
                    status: false,
                    message: `No se puede eliminar la línea estratégica porque está siendo usada por ${programasAsociados.length} programa(s): ${nombres}`,
                    error: 'Línea estratégica en uso por programas',
                    data: []
                }
            }

            // 3. Verificar si está siendo usada por metas de resultado
            const { data: metasAsociadas, error: metasError } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('id, nombre')
                .eq('linea_estrategica_id', id)
                .limit(5);

            if (metasError) {
                throw new InternalServerErrorException('Error al verificar metas resultado asociadas: ' + metasError.message);
            }

            if (metasAsociadas && metasAsociadas.length > 0) {
                const nombres = metasAsociadas.map(m => m.nombre).join(', ');
                return {
                    status: false,
                    message: `No se puede eliminar la línea estratégica porque está siendo usada por ${metasAsociadas.length} meta(s) de resultado: ${nombres}`,
                    error: 'Línea estratégica en uso por metas de resultado',
                    data: []
                }
            }

            // 4. Eliminar la línea estratégica
            const { error } = await this.supabaseService.clientAdmin
            .from('linea_estrategica')
            .delete()
            .eq('id', id);

            if (error) {
                throw new InternalServerErrorException('Error al eliminar línea estratégica: ' + error.message);
            }

            return {
                status: true,
                message: `Línea estratégica ${existingData.nombre} ha sido eliminada correctamente`,
                data: []
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al eliminar línea estratégica',
                error: error.message,
                data: []
            }
        }
    }
}
