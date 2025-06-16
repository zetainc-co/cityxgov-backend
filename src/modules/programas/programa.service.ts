import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { ProgramaRequest, FindAllProgramasResponse, Programa, ProgramaResponse } from './types/programa.dto';

@Injectable()
export class ProgramaService {
    constructor(private supabaseService: SupabaseService) { }

    //Obtiene todos los programas
    async findAll(): Promise<FindAllProgramasResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('programa')
                .select('*');

            if (error) {
                throw new InternalServerErrorException('Error al obtener programas: ' + error.message);
            }

            return {
                status: true,
                message: 'Programas encontrados',
                data: data as Programa[],
                error,
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al obtener programas',
                error: error.message,
                data: []
            }
        }
    }

    //Obtiene un programa por su id
    async findOne(id: number): Promise<ProgramaResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('programa')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException('Error al buscar programa: ' + error.message);
            }

            if (!data) {
                return {
                    status: false,
                    message: `No existe un programa con el ID ${id}`,
                    error: 'ID no encontrado'
                }
            }

            const programa: Programa = {
                id: data.id,
                linea_estrategica_id: data.linea_estrategica_id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                created_at: data.created_at,
                updated_at: data.updated_at
            }

            return {
                status: true,
                message: 'Programa encontrado',
                data: [programa]
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al buscar programa',
                error: error.message,
                data: []
            }
        }
    }

    //Crea un programa
    async create(createRequest: ProgramaRequest): Promise<ProgramaResponse> {
        try {
            //Validar si el programa existe
            const { data: existingPrograma, error: programaError } = await this.supabaseService.clientAdmin
                .from('programa')
                .select('id')
                .eq('nombre', createRequest.nombre)
                .maybeSingle();

            if (programaError) {
                throw new InternalServerErrorException('Error al validar nombre de programa');
            }
            if (existingPrograma) {
                return {
                    status: false,
                    message: 'Ya existe un programa con este nombre',
                    error: 'Nombre duplicado'
                }
            }


            //Crea el programa
            const { data, error } = await this.supabaseService.clientAdmin
                .from('programa')
                .insert([{
                    nombre: createRequest.nombre.trim(),
                    descripcion: createRequest.descripcion?.trim() || null,
                    linea_estrategica_id: createRequest.linea_estrategica_id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select('id, nombre, descripcion, linea_estrategica_id, created_at, updated_at')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear programa: ' + error.message);
            }

            const programaCreated: Programa = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                linea_estrategica_id: data.linea_estrategica_id,
                created_at: data.created_at,
                updated_at: data.updated_at
            }

            return {
                status: true,
                message: 'Programa creado correctamente',
                data: [programaCreated]
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al crear programa',
                error: error.message,
                data: []
            }
        }
    }

    //Actualiza un programa
    async update(id: number, createRequest: ProgramaRequest): Promise<ProgramaResponse> {
        try {
            // 1. Obtener el programa actual (todos los campos)
            const { data: currentPrograma, error: programaError } = await this.supabaseService.clientAdmin
                .from('programa')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (programaError) {
                throw new InternalServerErrorException('Error al validar nombre de programa');
            }

            if (!currentPrograma) {
                return {
                    status: false,
                    message: `No existe un programa con el ID ${id}`,
                    error: 'ID no encontrado'
                }
            }

            // 2. Validar si el nombre ya existe en otro programa
            const { data: duplicatePrograma, error: duplicateError } = await this.supabaseService.clientAdmin
                .from('programa')
                .select('id')
                .eq('nombre', createRequest.nombre)
                .neq('id', id)
                .maybeSingle();

            if (duplicateError) {
                throw new InternalServerErrorException('Error al validar nombre de programa');
            }

            if (duplicatePrograma) {
                return {
                    status: false,
                    message: 'Ya existe un programa con este nombre',
                    error: 'Nombre duplicado'
                }
            }

            // 3. Verificar si hay cambios
            const hasChanges =
                currentPrograma.nombre !== createRequest.nombre.trim() ||
                currentPrograma.descripcion !== createRequest.descripcion.trim() ||
                currentPrograma.linea_estrategica_id !== createRequest.linea_estrategica_id;

            if (!hasChanges) {
                return {
                    status: false,
                    message: 'No se detectaron cambios en el programa',
                    error: 'Sin cambios',
                    data: [{
                        id: currentPrograma.id,
                        nombre: currentPrograma.nombre,
                        descripcion: currentPrograma.descripcion,
                        linea_estrategica_id: currentPrograma.linea_estrategica_id,
                        created_at: currentPrograma.created_at,
                        updated_at: currentPrograma.updated_at
                    }]
                }
            }

            //Actualiza el programa
            const { data, error } = await this.supabaseService.clientAdmin
                .from('programa')
                .update({
                    nombre: createRequest.nombre.trim(),
                    descripcion: createRequest.descripcion?.trim() || null,
                    linea_estrategica_id: createRequest.linea_estrategica_id,
                })
                .eq('id', id)
                .select('id, nombre, descripcion, linea_estrategica_id, created_at, updated_at')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar programa: ' + error.message);
            }

            const programaUpdated: Programa = {
                id: data.id,
                nombre: data.nombre,
                descripcion: data.descripcion,
                linea_estrategica_id: data.linea_estrategica_id,
                created_at: data.created_at,
                updated_at: data.updated_at
            }

            return {
                status: true,
                message: 'Programa actualizado correctamente',
                data: [programaUpdated]
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al actualizar programa',
                error: error.message,
                data: []
            }
        }
    }


    async delete(id: number): Promise<ProgramaResponse> {
        try {
            //Verificar si el programa existe
            const { data: existingPrograma, error: programaError } = await this.supabaseService.clientAdmin
                .from('programa')
                .select('id')
                .eq('id', id)
                .maybeSingle();

            if (programaError) {
                throw new InternalServerErrorException('Error al verificar programa: ' + programaError.message);
            }

            if (!existingPrograma) {
                return {
                    status: false,
                    message: `No existe un programa con el ID ${id}`,
                    error: 'ID no encontrado'
                }
            }

            //Elimina el programa
            const { error } = await this.supabaseService.clientAdmin
                .from('programa')
                .delete()
                .eq('id', id);

            if (error) {
                throw new InternalServerErrorException('Error al eliminar programa: ' + error.message);
            }

            return {
                status: true,
                message: 'Programa eliminado correctamente',
                data: []
            }
        } catch (error) {
            return {
                status: false,
                message: 'Error al eliminar programa',
                error: error.message,
                data: []
            }
        }
    }
}
