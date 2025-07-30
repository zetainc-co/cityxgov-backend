import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ProgramacionFinancieraRequest,
  ProgramacionFinancieraResponse,
} from './dto/programacion_financiera.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';
@Injectable()
export class ProgramacionFinancieraService {
  constructor(private supabaseService: SupabaseService) {}

  // Obtiene todas las programaciones financieras
  async findAll(): Promise<ProgramacionFinancieraResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programacion_financiera')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener programacion financiera: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Programacion financiera encontrada',
        data: data,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      return {
        status: false,
        message: 'Error al obtener programacion financiera',
        data: [],
        error: error.message,
      };
    }
  }

  // Obtiene una programacion financiera por su id
  async findOne(id: number): Promise<ProgramacionFinancieraResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programacion_financiera')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener programacion financiera: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe una programacion financiera con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Programacion financiera encontrada',
        data: data,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      return {
        status: false,
        message: 'Error al obtener programacion financiera',
        data: [],
        error: error.message,
      };
    }
  }

  // Crea una nueva programacion financiera
  async create(
    createRequest: ProgramacionFinancieraRequest,
  ): Promise<ProgramacionFinancieraResponse> {
    try {
      // Verificar que la fuente de financiación existe
      const { data: fuenteExists, error: fuenteError } = await this.supabaseService.clientAdmin
          .from('fuentes_financiacion')
          .select('id, nombre')
          .eq('id', createRequest.fuente_id)
          .single();

      if (fuenteError || !fuenteExists) {
        return {
          status: false,
          message: `No existe una fuente de financiación con el ID ${createRequest.fuente_id}`,
          error: 'Fuente de financiación no encontrada',
          data: [],
        };
      }

      // Verificar que la meta producto existe
      const { data: metaExists, error: metaError } = await this.supabaseService.clientAdmin
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

      // Calcular el total del cuatrienio
      const totalCuatrienio =
        createRequest.periodo_2024 +
        createRequest.periodo_2025 +
        createRequest.periodo_2026 +
        createRequest.periodo_2027;

      // Crear el registro con el total_cuatrienio calculado
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programacion_financiera')
        .insert({
          ...createRequest,
          total_cuatrienio: totalCuatrienio,
        })
        .select('*')
        .single();

      if (error) {
        throw new InternalServerErrorException(
          'Error al crear programacion financiera: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Programacion financiera creada correctamente',
        data: data,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      return {
        status: false,
        message: 'Error al crear programacion financiera',
        error: error.message,
        data: [],
      };
    }
  }

  // Actualiza múltiples programaciones financieras POAI
  async updateMultiple(requests: ProgramacionFinancieraRequest[]): Promise<ProgramacionFinancieraResponse> {
    try {
      const resultData: any[] = [];

      for (const request of requests) {
        // Verificar que la fuente de financiación existe
        const { data: fuenteExists, error: fuenteError } =
          await this.supabaseService.clientAdmin
            .from('fuentes_financiacion')
            .select('id, nombre')
            .eq('id', request.fuente_id)
            .single();

        if (fuenteError || !fuenteExists) {
          return {
            status: false,
            message: `No existe una fuente de financiación con el ID ${request.fuente_id}`,
            error: 'Fuente de financiación no encontrada',
            data: [],
          };
        }

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

        // Buscar el registro existente para esta fuente + meta
        const { data: existingData, error: existingError } =
          await this.supabaseService.clientAdmin
            .from('programacion_financiera')
            .select('*')
            .eq('fuente_id', request.fuente_id)
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
            message: `No existe una programacion financiera para la fuente ${request.fuente_id} y meta ${request.meta_id}`,
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
            .from('programacion_financiera')
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
            'Error al actualizar programacion financiera: ' + updateError.message,
          );
        }

        resultData.push(updatedData);
      }

      return {
        status: true,
        message: 'Programaciones financieras POAI actualizadas exitosamente',
        data: resultData,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      return {
        status: false,
        message: 'Error al actualizar programaciones financieras POAI',
        data: [],
        error: error.message,
      };
    }
  }

  // Actualiza una programacion financiera
  async update(
    id: number,
    updateRequest: ProgramacionFinancieraRequest,
  ): Promise<ProgramacionFinancieraResponse> {
    try {
      // Verificar que la programacion financiera existe
      const { data: existingData, error: existingError } =
        await this.supabaseService.clientAdmin
          .from('programacion_financiera')
          .select('*')
          .eq('id', id)
          .maybeSingle();

      if (existingError) {
        throw new InternalServerErrorException(
          'Error al validar programacion financiera: ' + existingError.message,
        );
      }

      if (!existingData) {
        return {
          status: false,
          message: `No existe una programacion financiera con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // Verificar que la fuente de financiación existe
      const { data: fuenteExists, error: fuenteError } =
        await this.supabaseService.clientAdmin
          .from('fuentes_financiacion')
          .select('id, nombre')
          .eq('id', updateRequest.fuente_id)
          .single();

      if (fuenteError || !fuenteExists) {
        return {
          status: false,
          message: `No existe una fuente de financiación con el ID ${updateRequest.fuente_id}`,
          error: 'Fuente de financiación no encontrada',
          data: [],
        };
      }

      // Verificar que la meta producto existe
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

      // Calcular el total del cuatrienio para la comparación
      const newTotalCuatrienio =
        updateRequest.periodo_2024 +
        updateRequest.periodo_2025 +
        updateRequest.periodo_2026 +
        updateRequest.periodo_2027;

      // Verificar si hay cambios
      if (
        existingData.fuente_id === updateRequest.fuente_id &&
        existingData.meta_id === updateRequest.meta_id &&
        existingData.periodo_2024 === updateRequest.periodo_2024 &&
        existingData.periodo_2025 === updateRequest.periodo_2025 &&
        existingData.periodo_2026 === updateRequest.periodo_2026 &&
        existingData.periodo_2027 === updateRequest.periodo_2027 &&
        existingData.total_cuatrienio === newTotalCuatrienio
      ) {
        return {
          status: false,
          message: 'No se detectaron cambios en la programacion financiera',
          error: 'Sin Cambios',
          data: existingData,
        };
      }

      // Calcular el total del cuatrienio para la actualización
      const totalCuatrienio =
        updateRequest.periodo_2024 +
        updateRequest.periodo_2025 +
        updateRequest.periodo_2026 +
        updateRequest.periodo_2027;

      // Actualizar el registro con el total_cuatrienio calculado
      const { data: updatedData, error: updateError } =
        await this.supabaseService.clientAdmin
          .from('programacion_financiera')
          .update({
            ...updateRequest,
            total_cuatrienio: totalCuatrienio,
          })
          .eq('id', id)
          .select('*')
          .single();

      if (updateError) {
        throw new InternalServerErrorException(
          'Error al actualizar programacion financiera: ' + updateError.message,
        );
      }

      return {
        status: true,
        message: 'Programacion financiera actualizada correctamente',
        data: updatedData,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      return {
        status: false,
        message: 'Error al actualizar programacion financiera',
        error: error.message,
        data: [],
      };
    }
  }

  // Elimina una programacion financiera
  async delete(id: number): Promise<ProgramacionFinancieraResponse> {
    try {
      // Verificar que la programacion financiera existe
      const { data: existingData, error: existingError } =
        await this.supabaseService.clientAdmin
          .from('programacion_financiera')
          .select('*')
          .eq('id', id)
          .maybeSingle();

      if (existingError) {
        throw new InternalServerErrorException(
          'Error al validar programacion financiera: ' + existingError.message,
        );
      }

      if (!existingData) {
        return {
          status: false,
          message: `No existe una programacion financiera con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // Eliminar el registro
      const { error: deleteError } = await this.supabaseService.clientAdmin
        .from('programacion_financiera')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new InternalServerErrorException(
          'Error al eliminar programacion financiera: ' + deleteError.message,
        );
      }

      return {
        status: true,
        message: `Programacion financiera ID ${id} ha sido eliminada correctamente`,
        data: [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      return {
        status: false,
        message: 'Error al eliminar programacion financiera',
        error: error.message,
        data: [],
      };
    }
  }
}
