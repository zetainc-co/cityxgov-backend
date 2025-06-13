import {
    LineaEstrategica,
    LineaEstrategicaResponse,
    CreateLineaEstrategicaRequest,
} from './dto/linea_estrategica.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class LineaEstrategicaService {
    constructor(private supabaseService: SupabaseService) {}

    // Obtiene todas las líneas estratégicas
    async findAll(): Promise<LineaEstrategicaResponse> {
        try {
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('linea_estrategica')
                    .select('id, nombre, descripcion, plan_nacional, plan_departamental, created_at, updated_at');

            if (error) {
                throw new InternalServerErrorException('Error al obtener líneas estratégicas: ' + error.message);
            }

            return {
                status: true,
                message: 'Lineas estratégicas encontradas',
                data: data as LineaEstrategica[],
                error,
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al obtener líneas estratégicas',
                error: error.message
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
                throw new InternalServerErrorException('Error al obtener línea estratégica: ' + error.message);
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe una línea estratégica con el ID ${id}`,
                    error: 'ID no encontrado'
                }
            }

            const lineaEstrategica: LineaEstrategica = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                plan_nacional: data.plan_nacional,
                plan_departamental: data.plan_departamental,
                created_at: data.created_at,
                updated_at: data.updated_at
            }

            return {
                status: true,
                message: 'Línea estratégica encontrada',
                data: [lineaEstrategica]
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al obtener línea estratégica',
                error: error.message
            }
        }
    }

    //Crea una linea estrategica
    async create(createRequest: CreateLineaEstrategicaRequest): Promise<LineaEstrategicaResponse> {
        try{
            // Validar si el nombre ya existe
            const { data: existingLinea, error: validationError } =
                await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('id')
                .eq('nombre', createRequest.nombre)
                .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de línea estratégica');
            }

            if (existingLinea) {
                return {
                    status: false,
                    message: 'Ya existe una línea estratégica con este nombre',
                    error: 'Nombre duplicado'
                }
            }

            //Crea la linea estrategica
            const { data, error } =
            await this.supabaseService.clientAdmin
            .from('linea_estrategica')
                .insert([{
                    nombre: createRequest.nombre.trim(),
                    descripcion: createRequest.descripcion?.trim() || null,
                    plan_nacional: createRequest.plan_nacional.trim(),
                    plan_departamental: createRequest.plan_departamental.trim(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select('id, nombre, descripcion, plan_nacional, plan_departamental, created_at, updated_at')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear línea estratégica: ' + error.message);
            }

            const lineaEstrategicaCreated: LineaEstrategica = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                plan_nacional: data.plan_nacional,
                plan_departamental: data.plan_departamental,
                created_at: data.created_at,
                updated_at: data.updated_at
            }

            return {
                status: true,
                message: 'Línea estratégica creada correctamente',
                data: [lineaEstrategicaCreated]
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al crear línea estratégica',
                error: error.message
            }
        }
    }

    // Actualiza una línea estratégica
    async update(id: number, createRequest: CreateLineaEstrategicaRequest): Promise<LineaEstrategicaResponse> {
        try{
            // Primero verificar si existe
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
                    error: 'ID no encontrado'
                }
            }

            // Validar si el nombre ya existe en otra línea estratégica
            const { data: existingLinea, error: validationError } =
                await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('id')
                .eq('nombre', createRequest.nombre)
                .neq('id', id)
                .maybeSingle();

            if (validationError) {
                throw new InternalServerErrorException('Error al validar nombre de línea estratégica');
            }

            if (existingLinea) {
                return {
                    status: false,
                    message: 'Ya existe otra línea estratégica con este nombre',
                    error: 'Nombre duplicado'
                }
            }

            // Verificar si hay cambios
            const hasChanges =
                existingData.nombre !== createRequest.nombre ||
                existingData.descripcion !== createRequest.descripcion ||
                existingData.plan_nacional !== createRequest.plan_nacional ||
                existingData.plan_departamental !== createRequest.plan_departamental;

            if (!hasChanges) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en la línea estratégica',
                    error: 'Sin cambios',
                    data: [{
                        id: existingData.id,
                        nombre: existingData.nombre,
                        descripcion: existingData.descripcion,
                        plan_nacional: existingData.plan_nacional,
                        plan_departamental: existingData.plan_departamental,
                        created_at: existingData.created_at,
                        updated_at: existingData.updated_at
                    }]
                }
            }

            // Actualiza la línea estratégica
            const { data, error } =
            await this.supabaseService.clientAdmin
            .from('linea_estrategica')
            .update({
                nombre: createRequest.nombre,
                descripcion: createRequest.descripcion,
                plan_nacional: createRequest.plan_nacional,
                plan_departamental: createRequest.plan_departamental
            })
            .eq('id', id)
            .select('id, nombre, descripcion, plan_nacional, plan_departamental, created_at, updated_at')
            .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar línea estratégica: ' + error.message);
            }

            const lineaEstrategicaUpdated: LineaEstrategica = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                plan_nacional: data.plan_nacional,
                plan_departamental: data.plan_departamental,
                created_at: data.created_at,
                updated_at: data.updated_at
            }

            return {
                status: true,
                message: 'Línea estratégica actualizada correctamente',
                data: [lineaEstrategicaUpdated]
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al actualizar línea estratégica',
                error: error.message
            }
        }
    }

    // Elimina una línea estratégica
    async delete(id: number): Promise<LineaEstrategicaResponse> {
        try{
            // Primero verificar si existe
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
                    error: 'ID no encontrado'
                }
            }

            // Elimina la línea estratégica
            const { error } = await this.supabaseService.clientAdmin
            .from('linea_estrategica')
            .delete()
            .eq('id', id);

            if (error) {
                throw new InternalServerErrorException('Error al eliminar línea estratégica: ' + error.message);
            }

            return {
                status: true,
                message: 'Línea estratégica eliminada correctamente',
                data: []
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al eliminar línea estratégica',
                error: error.message
            }
        }
    }
}
