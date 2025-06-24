import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { OdsRequest, OdsResponse } from './dto/ods.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class OdsService {
  constructor(private supabaseService: SupabaseService) {}

  //Obtiene todos los ODS
  async findAll(): Promise<OdsResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('ods')
        .select('*');

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener ODS: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'ODS encontrados',
        data: data,
        error: null,
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener ODS',
        error: error.message,
        data: [],
      };
    }
  }

  //Obtiene un ODS por su id
  async findOne(id: number): Promise<OdsResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('ods')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al buscar ODS: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un ODS con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'ODS encontrado',
        data: data,
      };
      
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al buscar ODS',
        error: error.message,
        data: [],
      };
    }
  }

  //Crea un ODS
  async create(createRequest: OdsRequest): Promise<OdsResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('ods')
        .insert(createRequest)
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new BadRequestException({
            status: false,
            message: 'Ya existe un ODS con este nombre.',
            data: [],
          });
        }
        throw error;
      }

      return {
        status: true,
        message: 'ODS creado correctamente',
        data: data,
      };
      
    } catch (error) {
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al crear ODS',
        error: error.message,
        data: [],
      };
    }
  }

  //Actualiza un ODS
  async update(id: number, updateRequest: OdsRequest): Promise<OdsResponse> {
    try {
      //Verifica si el ODS existe
      const { data, error } =
        await this.supabaseService.clientAdmin
          .from('ods')
          .select('*')
          .eq('id', id)
          .maybeSingle();

      if (error) {
        throw new InternalServerErrorException('Error al validar ODS');
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un ODS con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // Verificar cambios
      if (data.nombre === updateRequest.nombre) {
        return {
          status: false,
          message: 'No se detectaron cambios en el ODS',
          error: 'Sin cambios',
          data: data,
        };
      }

      // Actualizar ODS
      const { data: updatedData, error: updatedError } = await this.supabaseService.clientAdmin
        .from('ods')
        .update({
          nombre: updateRequest.nombre,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .single();

      if (updatedError) {
        if (updatedError.code === '23505') {
          throw new BadRequestException({
            status: false,
            message: 'Ya existe un ODS con este nombre.',
            data: [],
          });
        }
        throw new InternalServerErrorException(
          'Error al actualizar ODS: ' + updatedError.message,
        );
      }

      return {
        status: true,
        message: 'ODS actualizado correctamente',
        data: updatedData,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al actualizar ODS',
        error: error.message,
        data: [],
      };
    }
  }

  async delete(id: number): Promise<OdsResponse> {
    try {
      //Verifica si el ODS existe
      const { data, error } =
        await this.supabaseService.clientAdmin
          .from('ods')
          .select('*')
          .eq('id', id)
          .maybeSingle();

      if (error) {
        throw new InternalServerErrorException('Error al verificar ODS');
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un ODS con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // Verificar si está siendo usado en meta_producto
      const { data: metaProductos, error: metaError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .select('id')
          .eq('ods_id', id)
          .limit(1);

      if (metaError) {
        throw new InternalServerErrorException(
          'Error al verificar uso del ODS',
        );
      }

      if (metaProductos.length > 0) {
        return {
          status: false,
          message:
            'No se puede eliminar el ODS porque está siendo usado en metas de producto',
          error: 'ODS en uso',
          data: [],
        };
      }

      // Eliminar ODS
      const { error: deletedError } = await this.supabaseService.clientAdmin
        .from('ods')
        .delete()
        .eq('id', id);

      if (deletedError) {
        throw new InternalServerErrorException(
          'Error al eliminar ODS: ' + deletedError.message,
        );
      }

      return {
        status: true,
        message: `ODS ${data.nombre} ha sido eliminado correctamente`,
        data: [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al eliminar ODS',
        error: error.message,
        data: [],
      };
    }
  }
}
