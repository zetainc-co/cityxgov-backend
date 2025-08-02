import { SupabaseService } from 'src/config/supabase/supabase.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  EnfoquePoblacionalRequest,
  EnfoquePoblacionalResponse,
} from './dto/enfoque_poblacional';

@Injectable()
export class EnfoquePoblacionalService {
  constructor(private supabaseService: SupabaseService) {}

  //Obtiene todos los enfoques poblacionales
  async findAll(): Promise<EnfoquePoblacionalResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('enfoque_poblacional')
        .select('*');

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener enfoques poblacionales: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Enfoques poblacionales obtenidos correctamente',
        data: data,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener los enfoques poblacionales',
        error: error.message,
        data: [],
      };
    }
  }

  //Obtiene un enfoque poblacional por su id
  async findOne(id: number): Promise<EnfoquePoblacionalResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('enfoque_poblacional')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener el enfoque poblacional: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un enfoque poblacional con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Enfoque poblacional obtenido correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener el enfoque poblacional',
        error: error.message,
        data: [],
      };
    }
  }

  //Crea un enfoque poblacional
  async create(
    createRequest: EnfoquePoblacionalRequest,
  ): Promise<EnfoquePoblacionalResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('enfoque_poblacional')
        .insert(createRequest)
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new BadRequestException({
            status: false,
            message: 'Ya existe un enfoque poblacional con este nombre.',
            data: [],
            error: 'Duplicado',
          });
        }
        throw new InternalServerErrorException(
          'Error al crear el enfoque poblacional: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Enfoque poblacional creado correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al crear el enfoque poblacional',
        error: error.message,
        data: [],
      };
    }
  }

  //Actualiza un enfoque poblacional
  async update(
    id: number,
    updateRequest: EnfoquePoblacionalRequest,
  ): Promise<EnfoquePoblacionalResponse> {
    try {
      //Verifica si el enfoque poblacional existe
      const { data: existingData, error: existingError } =
        await this.supabaseService.clientAdmin
          .from('enfoque_poblacional')
          .select('*')
          .eq('id', id)
          .maybeSingle();

      if (existingError) {
        throw new InternalServerErrorException(
          'Error al obtener el enfoque poblacional',
        );
      }

      if (!existingData) {
        return {
          status: false,
          message: `No existe un enfoque poblacional con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      //Verifica si hay cambios
      if (existingData.nombre === updateRequest.nombre) {
        return {
          status: false,
          message: 'No se detectaron cambios en el enfoque poblacional',
          error: 'Sin cambios',
          data: existingData,
        };
      }

      //Actualiza el enfoque poblacional
      const { data: updatedData, error: updatedError } =
        await this.supabaseService.clientAdmin
          .from('enfoque_poblacional')
          .update({
            nombre: updateRequest.nombre,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .single();

      if (updatedError) {
        throw new InternalServerErrorException(
          'Error al actualizar el enfoque poblacional: ' + updatedError.message,
        );
      }

      return {
        status: true,
        message: 'Enfoque poblacional actualizado correctamente',
        data: updatedData,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        status: false,
        message: 'Error al actualizar el enfoque poblacional',
        error: error.message,
        data: [],
      });
    }
  }

  //Elimina un enfoque poblacional
  async delete(id: number): Promise<EnfoquePoblacionalResponse> {
    try {
      //Verifica si el enfoque poblacional existe
      const { data: existingData, error: existingError } =
        await this.supabaseService.clientAdmin
          .from('enfoque_poblacional')
          .select('*')
          .eq('id', id)
          .maybeSingle();

      if (existingError) {
        throw new InternalServerErrorException(
          'Error al obtener el enfoque poblacional',
        );
      }

      if (!existingData) {
        return {
          status: false,
          message: `No existe un enfoque poblacional con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      //Verifica si el enfoque poblacional está siendo usado en meta_producto
      const { data: metaProductos, error: metaError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .select('id')
          .eq('enfoque_poblacional_id', id)
          .limit(1);

      if (metaError) {
        throw new InternalServerErrorException(
          'Error al verificar si el enfoque poblacional está siendo usado en meta_producto',
        );
      }

      if (metaProductos.length > 0) {
        return {
          status: false,
          message:
            'No se puede eliminar el enfoque poblacional porque está siendo usado en metas de producto',
          error: 'Enfoque poblacional en uso',
          data: [],
        };
      }

      //Elimina el enfoque poblacional
      const { error: deletedError } = await this.supabaseService.clientAdmin
        .from('enfoque_poblacional')
        .delete()
        .eq('id', id);

      if (deletedError) {
        throw new InternalServerErrorException(
          'Error al eliminar el enfoque poblacional',
        );
      }

      return {
        status: true,
        message: 'Enfoque poblacional eliminado correctamente',
        data: [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al eliminar el enfoque poblacional',
        error: error.message,
        data: [],
      };
    }
  }
}
