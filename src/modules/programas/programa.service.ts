import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { CreateProgramaRequest, FindAllProgramasResponse, Programa, CreateProgramaResponse } from './types/programa';

@Injectable()
export class ProgramaService {
    constructor(private supabaseService: SupabaseService) {}

    async findAll(): Promise<FindAllProgramasResponse> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('programa')
            .select('*');
        return {
            status: 200,
            message: 'Programas encontrados',
            data: data as Programa[],
            error,
        };
    }

    async findById(id: number): Promise<CreateProgramaResponse> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('programa')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return {
                status: false,
                message: 'Error al buscar programa',
                error,
            };
        }

        if (!data) {
            return {
                status: false,
                message: 'Programa no encontrado',
            };
        }

        return {
            status: true,
            message: 'Programa encontrado',
            data: [data as Programa],
        };
    }

    async create(createRequest: CreateProgramaRequest): Promise<CreateProgramaResponse> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('programa')
            .insert([createRequest])
            .select('*')
            .single();
        if (error) {
            return {
                status: false,
                message: 'Error al crear programa',
                error,
            };
        }
        return {
            status: true,
            message: 'Programa creado correctamente',
            data: [data as Programa],
        };
    }


}
