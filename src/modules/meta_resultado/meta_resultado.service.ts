import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { CreateMetaResultadoRequest, FindAllMetaResultadosResponse, MetaResultado, CreateMetaResultadoResponse } from './types/meta_resultado';

@Injectable()
export class MetaResultadoService {
    constructor(private supabaseService: SupabaseService) {}

    async findAll(): Promise<FindAllMetaResultadosResponse> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('meta_resultado')
            .select('*');
        return {
            status: 200,
            message: 'Metas de resultado encontradas',
            data: data as MetaResultado[],
            error,
        };
    }

    async findById(id: number): Promise<CreateMetaResultadoResponse> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('meta_resultado')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return {
                status: false,
                message: 'Error al buscar meta de resultado',
                error,
            };
        }

        if (!data) {
            return {
                status: false,
                message: 'Meta de resultado no encontrada',
            };
        }

        return {
            status: true,
            message: 'Meta de resultado encontrada',
            data: [data as MetaResultado],
        };
    }

    async create(createRequest: CreateMetaResultadoRequest): Promise<CreateMetaResultadoResponse> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('meta_resultado')
            .insert([createRequest])
            .select('*')
            .single();
        if (error) {
            return {
                status: false,
                message: 'Error al crear meta de resultado',
                error,
            };
        }
        return {
            status: true,
            message: 'Meta de resultado creada correctamente',
            data: [data as MetaResultado],
        };
    }
}
