import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  MetaConMGA,
  BancoProyectosRequest,
  BancoProyectosResponse,
} from './dto/banco-proyectos.dto';
import { SupabaseService } from '../../config/supabase/supabase.service';

@Injectable()
export class BancoProyectosService {
  constructor(private supabaseService: SupabaseService) { }

  // Obtiene todos los proyectos
  async findAll(): Promise<BancoProyectosResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('banco_proyectos')
        .select('*')

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener proyectos: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Proyectos encontrados correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener proyectos',
        error: error.message,
      };
    }
  }

  // Obtiene un proyecto por su ID
  async findOne(id: number): Promise<BancoProyectosResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('banco_proyectos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener proyecto: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un proyecto con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Proyecto encontrado correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener proyecto',
        error: error.message,
      };
    }
  }

  // Crea un nuevo proyecto
  async create(createRequest: BancoProyectosRequest): Promise<BancoProyectosResponse> {
    try {
      // Validar que las metas de producto tengan el mismo código MGA
      const validationResult = await this.validateMetasProductoMGA(createRequest.meta_producto_ids);
      if (!validationResult.status) {
        return validationResult;
      }

      // Crear el proyecto
      const { data: proyecto, error: proyectoError } = await this.supabaseService.clientAdmin
        .from('banco_proyectos')
        .insert({
          nombre: createRequest.nombre,
          codigo_bpim: createRequest.codigo_bpim,
          descripcion: createRequest.descripcion,
        })
        .select()
        .single();

      if (proyectoError) {
        if (proyectoError.code === '23505') {
          return {
            status: false,
            message: 'Ya existe un proyecto con este código BPIM',
            error: 'Código BPIM duplicado',
            data: [],
          };
        }
        throw new InternalServerErrorException(
          'Error al crear proyecto: ' + proyectoError.message,
        );
      }

      // Crear las relaciones con metas de producto
      if (createRequest.meta_producto_ids.length > 0) {
        const relaciones = createRequest.meta_producto_ids.map(metaId => ({
          proyecto_id: proyecto.id,
          meta_producto_id: metaId,
        }));

        const { error: relacionesError } = await this.supabaseService.clientAdmin
          .from('proyecto_metas')
          .insert(relaciones);

        if (relacionesError) {
          throw new InternalServerErrorException(
            'Error al crear relaciones con metas de producto: ' + relacionesError.message,
          );
        }
      }

      return {
        status: true,
        message: 'Proyecto creado correctamente',
        data: proyecto,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al crear proyecto',
        error: error.message,
      };
    }
  }

  // Actualiza un proyecto
  async update(id: number, updateRequest: BancoProyectosRequest): Promise<BancoProyectosResponse> {
    try {
      // Validar que las metas de producto tengan el mismo código MGA
      const validationResult = await this.validateMetasProductoMGA(updateRequest.meta_producto_ids);
      if (!validationResult.status) {
        return validationResult;
      }

      // Actualizar el proyecto
      const { data, error } = await this.supabaseService.clientAdmin
        .from('banco_proyectos')
        .update({
          nombre: updateRequest.nombre,
          codigo_bpim: updateRequest.codigo_bpim,
          descripcion: updateRequest.descripcion,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException(
          'Error al actualizar proyecto: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un proyecto con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // Actualizar las relaciones con metas de producto
      // Primero eliminar las relaciones existentes
      await this.supabaseService.clientAdmin
        .from('proyecto_metas')
        .delete()
        .eq('proyecto_id', id);

      // Luego crear las nuevas relaciones
      if (updateRequest.meta_producto_ids.length > 0) {
        const relaciones = updateRequest.meta_producto_ids.map(metaId => ({
          proyecto_id: id,
          meta_producto_id: metaId,
        }));

        const { error: relacionesError } = await this.supabaseService.clientAdmin
          .from('proyecto_metas')
          .insert(relaciones);

        if (relacionesError) {
          throw new InternalServerErrorException(
            'Error al actualizar relaciones con metas de producto: ' + relacionesError.message,
          );
        }
      }

      return {
        status: true,
        message: 'Proyecto actualizado correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al actualizar proyecto',
        error: error.message,
      };
    }
  }

  // Elimina un proyecto
  async delete(id: number): Promise<BancoProyectosResponse> {
    try {
      // Primero eliminar las relaciones con metas de producto
      await this.supabaseService.clientAdmin
        .from('proyecto_metas')
        .delete()
        .eq('proyecto_id', id);

      // Luego eliminar el proyecto
      const { error } = await this.supabaseService.clientAdmin
        .from('banco_proyectos')
        .delete()
        .eq('id', id);

      if (error) {
        throw new InternalServerErrorException(
          'Error al eliminar proyecto: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Proyecto eliminado correctamente',
        data: [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al eliminar proyecto',
        error: error.message,
      };
    }
  }

  // Obtiene un proyecto con sus relaciones
  async findOneWithRelations(id: number): Promise<BancoProyectosResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('banco_proyectos')
        .select(`
          *,
          proyecto_metas(
            meta_producto_id,
            meta_producto(
              *,
              caracterizacion_mga(*)
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener proyecto: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un proyecto con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Proyecto encontrado correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener proyecto',
        error: error.message,
      };
    }
  }

  // Valida que las metas de producto tengan el mismo código MGA
  private async validateMetasProductoMGA(metaProductoIds: number[]): Promise<BancoProyectosResponse> {
    try {
      if (metaProductoIds.length === 0) {
        return {
          status: true,
          message: 'No hay metas de producto para validar',
          data: [],
        };
      }

      const { data: metasRaw, error } = await this.supabaseService.clientAdmin
        .from('meta_producto')
        .select(`
          id,
          caracterizacion_mga(
            programa
          )
        `)
        .in('id', metaProductoIds);

      const metas = metasRaw as MetaConMGA[];

      if (error) {
        throw new InternalServerErrorException(
          'Error al validar metas de producto: ' + error.message,
        );
      }

      if (metas.length === 0) {
        return {
          status: false,
          message: 'No se encontraron las metas de producto especificadas',
          error: 'Metas no encontradas',
          data: [],
        };
      }

      // Verificar que todas las metas tengan el mismo programa MGA
      const codigosPrograma = metas
        .map(meta => {
          if (Array.isArray(meta.caracterizacion_mga)) {
            return meta.caracterizacion_mga[0]?.programa;
          }
          return meta.caracterizacion_mga?.programa;
        })
        .filter(Boolean);

      if (codigosPrograma.length === 0) {
        return {
          status: false,
          message: 'Las metas de producto no tienen programas MGA válidos',
          error: 'Programas MGA inválidos',
          data: [],
        };
      }

      const codigoUnico = codigosPrograma[0];
      const todosIguales = codigosPrograma.every(codigo => codigo === codigoUnico);

      if (!todosIguales) {
        return {
          status: false,
          message: 'Todas las metas de producto deben tener el mismo programa MGA',
          error: 'Programas MGA diferentes',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Validación de código MGA exitosa',
        data: [],
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al validar código MGA',
        error: error.message,
      };
    }
  }
}
