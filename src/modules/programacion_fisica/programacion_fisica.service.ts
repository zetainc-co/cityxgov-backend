import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { ProgramacionFisicaRequest } from './dto/programacion_fisica.dto';

export interface ProgramacionFisicaResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: any;
}

@Injectable()
export class ProgramacionFisicaService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<ProgramacionFisicaResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programacion_fisica')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener programaciones físicas: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Programaciones físicas obtenidas exitosamente',
        data: data,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return {
        status: false,
        message: 'Error al obtener programaciones físicas',
        error: error.message,
        data: [],
      };
    }
  }

  async findOne(id: number): Promise<ProgramacionFisicaResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programacion_fisica')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: false,
            message: 'Programación física no encontrada',
            error: 'Registro no encontrado',
            data: null,
          };
        }
        throw new InternalServerErrorException(
          'Error al obtener programación física: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Programación física obtenida exitosamente',
        data: data,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return {
        status: false,
        message: 'Error al obtener programación física',
        error: error.message,
        data: null,
      };
    }
  }

  async create(createRequest: ProgramacionFisicaRequest): Promise<ProgramacionFisicaResponse> {
    try {
      const { data: metaExists, error: metaError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .select('id, nombre')
          .eq('id', createRequest.meta_id)
          .single();

      if (metaError || !metaExists) {
        return {
          status: false,
          message: `No existe una meta producto con el ID ${createRequest.meta_id}`,
          error: 'Meta producto no encontrada',
          data: [],
        };
      }

      const { data: existingData, error: existingError } =
        await this.supabaseService.clientAdmin
          .from('programacion_fisica')
          .select('id')
          .eq('meta_id', createRequest.meta_id)
          .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        throw new InternalServerErrorException(
          'Error al verificar duplicados: ' + existingError.message,
        );
      }

      if (existingData) {
        return {
          status: false,
          message: `Ya existe una programación física para la meta ${createRequest.meta_id}`,
          error: 'Registro duplicado',
          data: [],
        };
      }

      const totalCuatrienio =
        createRequest.periodo_2024 +
        createRequest.periodo_2025 +
        createRequest.periodo_2026 +
        createRequest.periodo_2027;

      const { data: newData, error: insertError } =
        await this.supabaseService.clientAdmin
          .from('programacion_fisica')
          .insert({
            meta_id: createRequest.meta_id,
            periodo_2024: createRequest.periodo_2024,
            periodo_2025: createRequest.periodo_2025,
            periodo_2026: createRequest.periodo_2026,
            periodo_2027: createRequest.periodo_2027,
            total_cuatrienio: totalCuatrienio,
          })
          .select()
          .single();

      if (insertError) {
        throw new InternalServerErrorException(
          'Error al crear programación física: ' + insertError.message,
        );
      }

      return {
        status: true,
        message: 'Programación física creada exitosamente',
        data: newData,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return {
        status: false,
        message: 'Error al crear programación física',
        error: error.message,
        data: [],
      };
    }
  }

  async update(id: number, updateRequest: ProgramacionFisicaRequest): Promise<ProgramacionFisicaResponse> {
    try {
      const { data: metaExists, error: metaError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .select('id, nombre')
          .eq('id', updateRequest.meta_id)
          .single();

      if (metaError || !metaExists) {
        return {
          status: false,
          message: `No existe una meta producto con el ID ${updateRequest.meta_id}`,
          error: 'Meta producto no encontrada',
          data: [],
        };
      }

      const { data: existingData, error: existingError } =
        await this.supabaseService.clientAdmin
          .from('programacion_fisica')
          .select('id')
          .eq('id', id)
          .single();

      if (existingError) {
        if (existingError.code === 'PGRST116') {
          return {
            status: false,
            message: 'Programación física no encontrada',
            error: 'Registro no encontrado',
            data: [],
          };
        }
        throw new InternalServerErrorException(
          'Error al verificar registro existente: ' + existingError.message,
        );
      }

      const totalCuatrienio =
        updateRequest.periodo_2024 +
        updateRequest.periodo_2025 +
        updateRequest.periodo_2026 +
        updateRequest.periodo_2027;

      const { data: updatedData, error: updateError } =
        await this.supabaseService.clientAdmin
          .from('programacion_fisica')
          .update({
            meta_id: updateRequest.meta_id,
            periodo_2024: updateRequest.periodo_2024,
            periodo_2025: updateRequest.periodo_2025,
            periodo_2026: updateRequest.periodo_2026,
            periodo_2027: updateRequest.periodo_2027,
            total_cuatrienio: totalCuatrienio,
          })
          .eq('id', id)
          .select()
          .single();

      if (updateError) {
        throw new InternalServerErrorException(
          'Error al actualizar programación física: ' + updateError.message,
        );
      }

      return {
        status: true,
        message: 'Programación física actualizada exitosamente',
        data: updatedData,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return {
        status: false,
        message: 'Error al actualizar programación física',
        error: error.message,
        data: [],
      };
    }
  }

  // Actualiza múltiples programaciones físicas POAI
  async updateMultiple(requests: ProgramacionFisicaRequest[]): Promise<ProgramacionFisicaResponse> {
    console.log('🔍 Debug - Service updateMultiple() ejecutándose');
    console.log('🔍 Debug - Service updateMultiple() requests recibidos:', JSON.stringify(requests, null, 2));
    console.log('🔍 Debug - Service updateMultiple() tipo de requests:', typeof requests);
    console.log('🔍 Debug - Service updateMultiple() es array:', Array.isArray(requests));
    console.log('🔍 Debug - Service updateMultiple() cantidad de requests:', requests?.length || 0);

    try {
      const resultData: any[] = [];

      for (const request of requests) {
        // Verificar que la meta producto existe
        const { data: metaExists, error: metaError } =
          await this.supabaseService.clientAdmin
            .from('meta_producto')
            .select('id, nombre')
            .eq('id', request.meta_id)
            .single();

        if (metaError || !metaExists) {
          return {
            status: false,
            message: `No existe una meta producto con el ID ${request.meta_id}`,
            error: 'Meta producto no encontrada',
            data: [],
          };
        }

        // Buscar el registro existente para esta meta
        const { data: existingData, error: existingError } =
          await this.supabaseService.clientAdmin
            .from('programacion_fisica')
            .select('*')
            .eq('meta_id', request.meta_id)
            .maybeSingle();

        if (existingError && existingError.code !== 'PGRST116') {
          throw new InternalServerErrorException(
            'Error al buscar registro existente: ' + existingError.message,
          );
        }

        if (!existingData) {
          return {
            status: false,
            message: `No existe una programación física para la meta ${request.meta_id}. Debe crear primero la programación física en el Plan Indicativo.`,
            error: 'Registro no encontrado',
            data: [],
          };
        }

        // Calcular el total del cuatrienio
        const totalCuatrienio =
          request.periodo_2024 +
          request.periodo_2025 +
          request.periodo_2026 +
          request.periodo_2027;

        // Actualizar el registro existente
        const { data: updatedData, error: updateError } =
          await this.supabaseService.clientAdmin
            .from('programacion_fisica')
            .update({
              periodo_2024: request.periodo_2024,
              periodo_2025: request.periodo_2025,
              periodo_2026: request.periodo_2026,
              periodo_2027: request.periodo_2027,
              total_cuatrienio: totalCuatrienio,
            })
            .eq('id', existingData.id)
            .select()
            .single();

        if (updateError) {
          throw new InternalServerErrorException(
            'Error al actualizar programación física: ' + updateError.message,
          );
        }

        resultData.push(updatedData);
      }

      return {
        status: true,
        message: 'Programaciones físicas POAI actualizadas exitosamente',
        data: resultData,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return {
        status: false,
        message: 'Error al actualizar programaciones físicas POAI',
        error: error.message,
        data: [],
      };
    }
  }

  async delete(id: number): Promise<ProgramacionFisicaResponse> {
    try {
      const { data: existingData, error: existingError } =
        await this.supabaseService.clientAdmin
          .from('programacion_fisica')
          .select('id')
          .eq('id', id)
          .single();

      if (existingError) {
        if (existingError.code === 'PGRST116') {
          return {
            status: false,
            message: 'Programación física no encontrada',
            error: 'Registro no encontrado',
            data: [],
          };
        }
        throw new InternalServerErrorException(
          'Error al verificar registro existente: ' + existingError.message,
        );
      }

      const { error: deleteError } = await this.supabaseService.clientAdmin
        .from('programacion_fisica')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new InternalServerErrorException(
          'Error al eliminar programación física: ' + deleteError.message,
        );
      }

      return {
        status: true,
        message: 'Programación física eliminada exitosamente',
        data: null,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return {
        status: false,
        message: 'Error al eliminar programación física',
        error: error.message,
        data: [],
      };
    }
  }
}
