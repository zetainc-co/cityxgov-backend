import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  MetaProductoRequest,
  MetaProductoResponse,
  MetaProducto,
} from './dto/meta_producto.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class MetaProductoService {
  constructor(private supabaseService: SupabaseService) { }

  // Obtiene todos los meta_producto con sus relaciones
  async findAll(): Promise<MetaProductoResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('meta_producto')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener meta productos: ' + error.message,
        );
      }

      // Para cada meta_producto, obtener solo los IDs de sus meta_resultados
      const metaProductosWithIds = await Promise.all(
        data.map(async (metaProducto) => {
          const { data: metaResultados, error: metaResultadosError } =
            await this.supabaseService.clientAdmin
              .from('metas_resultado_producto')
              .select('meta_resultado_id')
              .eq('meta_producto_id', metaProducto.id);

          if (metaResultadosError) {
            console.error(
              `Error obteniendo meta_resultados para meta_producto ${metaProducto.id}:`,
              metaResultadosError,
            );
            return {
              ...metaProducto,
              meta_resultado_ids: [],
            };
          }

          return {
            ...metaProducto,
            meta_resultado_ids:
              metaResultados?.map((mr) => mr.meta_resultado_id) || [],
          };
        }),
      );

      return {
        status: true,
        message: 'Meta productos encontrados',
        data: metaProductosWithIds,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener meta productos',
        error: error.message,
        data: [],
      };
    }
  }

  // Obtiene un meta_producto por su id
  async findOne(id: number): Promise<MetaProductoResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('meta_producto')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al buscar meta producto: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un meta producto con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // Obtener solo los IDs de meta_resultados relacionados
      const { data: metaResultados, error: metaResultadosError } =
        await this.supabaseService.clientAdmin
          .from('metas_resultado_producto')
          .select('meta_resultado_id')
          .eq('meta_producto_id', id);

      if (metaResultadosError) {
        throw new InternalServerErrorException(
          'Error al obtener meta resultados relacionados: ' +
          metaResultadosError.message,
        );
      }

      // Agregar solo los IDs de meta_resultados al resultado
      const result = {
        ...data,
        meta_resultado_ids:
          metaResultados?.map((mr) => mr.meta_resultado_id) || [],
      };

      return {
        status: true,
        message: 'Meta producto encontrado',
        data: [result],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al buscar meta producto',
        error: error.message,
        data: [],
      };
    }
  }

  // Crea un meta_producto con sus relaciones
  async create(
    createRequest: MetaProductoRequest,
  ): Promise<MetaProductoResponse> {
    try {
      // Validar que existan los registros relacionados
      await this.validateRelatedRecords(createRequest);

      // Verificar que el nombre no exista
      const { data: existingCode, error: codeError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .select('id')
          .eq('nombre', createRequest.nombre.trim())
          .maybeSingle();

      if (codeError) {
        throw new InternalServerErrorException('Error al validar nombre');
      }

      if (existingCode) {
        return {
          status: false,
          message: 'Ya existe un meta producto con este nombre',
          error: 'Nombre duplicado',
          data: [],
        };
      }

      // Crear meta_producto
      const { data: metaProducto, error: createError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .insert({
            caracterizacion_mga_id: createRequest.caracterizacion_mga_id,
            area_id: createRequest.area_id,
            ods_id: createRequest.ods_id,
            enfoque_poblacional_id: createRequest.enfoque_poblacional_id,
            linea_base: createRequest.linea_base.trim(),
            instrumento_planeacion: createRequest.instrumento_planeacion.trim(),
            nombre: createRequest.nombre.trim(),
            meta_numerica: createRequest.meta_numerica.trim(),
            orientacion: createRequest.orientacion.trim(),
            enfoque_territorial: createRequest.enfoque_territorial.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .single();

      if (createError) {
        throw new InternalServerErrorException(
          'Error al crear meta producto: ' + createError.message,
        );
      }

      // Crear las relaciones muchos a muchos
      await this.createMetaResultadoRelations(
        metaProducto.id,
        createRequest.meta_resultado_ids,
      );

      // Obtener solo los IDs de meta_resultados relacionados
      const { data: metaResultados, error: metaResultadosError } =
        await this.supabaseService.clientAdmin
          .from('metas_resultado_producto')
          .select('meta_resultado_id')
          .eq('meta_producto_id', metaProducto.id);

      if (metaResultadosError) {
        throw new InternalServerErrorException(
          'Error al obtener meta resultados relacionados: ' +
          metaResultadosError.message,
        );
      }

      // Agregar solo los IDs de meta_resultados al resultado
      const result = {
        ...metaProducto,
        meta_resultado_ids:
          metaResultados?.map((mr) => mr.meta_resultado_id) || [],
      };

      return {
        status: true,
        message: 'Meta producto creado correctamente',
        data: [result],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al crear meta producto',
        error: error.message,
        data: [],
      };
    }
  }

  // Actualiza un meta_producto
  async update(
    id: number,
    updateRequest: MetaProductoRequest,
  ): Promise<MetaProductoResponse> {
    try {
      // Verificar que existe
      const { data: existing, error: existingError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .select('*')
          .eq('id', id)
          .maybeSingle();

      if (existingError) {
        throw new InternalServerErrorException(
          'Error al validar meta producto',
        );
      }

      if (!existing) {
        return {
          status: false,
          message: `No existe un meta producto con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // Validar que existan los registros relacionados
      await this.validateRelatedRecords(updateRequest);

      // Verificar que el nombre no exista en otro registro
      const { data: duplicateCode, error: duplicateError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .select('id')
          .eq('nombre', updateRequest.nombre.trim())
          .neq('id', id)
          .maybeSingle();

      if (duplicateError) {
        throw new InternalServerErrorException(
          'Error al validar nombre duplicado',
        );
      }

      if (duplicateCode) {
        return {
          status: false,
          message: 'Ya existe un meta producto con este nombre',
          error: 'Nombre duplicado',
          data: [],
        };
      }

      // Obtener meta_resultados actuales para comparar
      const { data: currentMetaResultados, error: currentMetaError } =
        await this.supabaseService.clientAdmin
          .from('metas_resultado_producto')
          .select('meta_resultado_id')
          .eq('meta_producto_id', id);

      if (currentMetaError) {
        throw new InternalServerErrorException(
          'Error al obtener meta_resultados actuales: ' +
          currentMetaError.message,
        );
      }

      const currentMetaResultadoIds =
        currentMetaResultados?.map((mr) => mr.meta_resultado_id) || [];
      const newMetaResultadoIds = [...updateRequest.meta_resultado_ids].sort();
      const currentMetaResultadoIdsSorted = [...currentMetaResultadoIds].sort();

      // Verificar cambios en campos básicos
      const hasBasicChanges =
        existing.caracterizacion_mga_id !==
        updateRequest.caracterizacion_mga_id ||
        existing.area_id !== updateRequest.area_id ||
        existing.ods_id !== updateRequest.ods_id ||
        existing.enfoque_poblacional_id !==
        updateRequest.enfoque_poblacional_id ||
        existing.linea_base !== updateRequest.linea_base.trim() ||
        existing.instrumento_planeacion !==
        updateRequest.instrumento_planeacion.trim() ||
        existing.nombre !== updateRequest.nombre.trim() ||
        existing.meta_numerica !== updateRequest.meta_numerica.trim() ||
        existing.orientacion !== updateRequest.orientacion.trim() ||
        existing.enfoque_territorial !== updateRequest.enfoque_territorial.trim();

      // Verificar cambios en meta_resultado_ids
      const hasMetaResultadoChanges =
        JSON.stringify(newMetaResultadoIds) !==
        JSON.stringify(currentMetaResultadoIdsSorted);

      if (!hasBasicChanges && !hasMetaResultadoChanges) {
        // Obtener el meta_producto básico
        const { data: metaProductoBasic, error: basicError } =
          await this.supabaseService.clientAdmin
            .from('meta_producto')
            .select('*')
            .eq('id', id)
            .single();

        if (basicError) {
          throw new InternalServerErrorException(
            'Error al obtener meta_producto: ' + basicError.message,
          );
        }

        // Obtener solo los IDs de meta_resultados
        const { data: metaResultados, error: metaResultadosError } =
          await this.supabaseService.clientAdmin
            .from('metas_resultado_producto')
            .select('meta_resultado_id')
            .eq('meta_producto_id', id);

        if (metaResultadosError) {
          throw new InternalServerErrorException(
            'Error al obtener meta_resultados: ' + metaResultadosError.message,
          );
        }

        const result = {
          ...metaProductoBasic,
          meta_resultado_ids:
            metaResultados?.map((mr) => mr.meta_resultado_id) || [],
        };

        return {
          status: false,
          message: 'No se detectaron cambios en el meta producto',
          error: 'Sin cambios',
          data: [result],
        };
      }

      // Actualizar meta_producto solo si hay cambios básicos
      if (hasBasicChanges) {
        const { data: updatedData, error: updatedError } =
          await this.supabaseService.clientAdmin
            .from('meta_producto')
            .update({
              caracterizacion_mga_id: updateRequest.caracterizacion_mga_id,
              area_id: updateRequest.area_id,
              ods_id: updateRequest.ods_id,
              enfoque_poblacional_id: updateRequest.enfoque_poblacional_id,
              linea_base: updateRequest.linea_base.trim(),
              instrumento_planeacion:
                updateRequest.instrumento_planeacion.trim(),
              nombre: updateRequest.nombre.trim(),
              meta_numerica: updateRequest.meta_numerica.trim(),
              orientacion: updateRequest.orientacion.trim(),
              enfoque_territorial: updateRequest.enfoque_territorial.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*')
            .single();

        if (updatedError) {
          throw new InternalServerErrorException(
            'Error al actualizar meta producto: ' + updatedError.message,
          );
        }
      }

      // Actualizar relaciones muchos a muchos si hay cambios
      if (hasMetaResultadoChanges) {
        await this.updateMetaResultadoRelations(
          id,
          updateRequest.meta_resultado_ids,
        );
      }

      // Obtener el meta_producto actualizado
      const { data: metaProductoUpdated, error: updatedError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .select('*')
          .eq('id', id)
          .single();

      if (updatedError) {
        throw new InternalServerErrorException(
          'Error al obtener meta producto actualizado: ' + updatedError.message,
        );
      }

      // Obtener solo los IDs de meta_resultados relacionados
      const { data: metaResultados, error: metaResultadosError } =
        await this.supabaseService.clientAdmin
          .from('metas_resultado_producto')
          .select('meta_resultado_id')
          .eq('meta_producto_id', id);

      if (metaResultadosError) {
        throw new InternalServerErrorException(
          'Error al obtener meta resultados relacionados: ' +
          metaResultadosError.message,
        );
      }

      // Agregar solo los IDs de meta_resultados al resultado
      const result = {
        ...metaProductoUpdated,
        meta_resultado_ids:
          metaResultados?.map((mr) => mr.meta_resultado_id) || [],
      };

      return {
        status: true,
        message: 'Meta producto actualizado correctamente',
        data: [result],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al actualizar meta producto',
        error: error.message,
        data: [],
      };
    }
  }

  // Elimina un meta_producto
  async delete(id: number): Promise<MetaProductoResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('meta_producto')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al verificar meta producto',
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un meta producto con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // Verificar si está siendo usado en programacion_financiera
      const { data: programacionFinanciera, error: programacionError } =
        await this.supabaseService.clientAdmin
          .from('programacion_financiera')
          .select('id')
          .eq('meta_id', id)
          .limit(1);

      if (programacionError) {
        throw new InternalServerErrorException(
          'Error al verificar uso del meta producto en programación financiera',
        );
      }

      if (programacionFinanciera.length > 0) {
        return {
          status: false,
          message:
            'No se puede eliminar el meta producto porque está siendo usado en programación financiera',
          error: 'Meta producto en uso',
          data: [],
        };
      }

      // Verificar si está siendo usado en programacion_fisica
      const { data: programacionFisica, error: fisicaError } =
        await this.supabaseService.clientAdmin
          .from('programacion_fisica')
          .select('id')
          .eq('meta_id', id)
          .limit(1);

      if (fisicaError) {
        throw new InternalServerErrorException(
          'Error al verificar uso del meta producto en programación física',
        );
      }

      if (programacionFisica.length > 0) {
        return {
          status: false,
          message:
            'No se puede eliminar el meta producto porque está siendo usado en programación física',
          error: 'Meta producto en uso',
          data: [],
        };
      }

      // Eliminar primero las relaciones muchos a muchos
      const { error: relationsError } = await this.supabaseService.clientAdmin
        .from('metas_resultado_producto')
        .delete()
        .eq('meta_producto_id', id);

      if (relationsError) {
        throw new InternalServerErrorException(
          'Error al eliminar relaciones: ' + relationsError.message,
        );
      }

      // Eliminar meta_producto
      const { error: deletedError } = await this.supabaseService.clientAdmin
        .from('meta_producto')
        .delete()
        .eq('id', id);

      if (deletedError) {
        throw new InternalServerErrorException(
          'Error al eliminar meta producto: ' + deletedError.message,
        );
      }

      return {
        status: true,
        message: `Meta producto ${data.nombre} ha sido eliminado correctamente`,
        data: [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al eliminar meta producto',
        error: error.message,
        data: [],
      };
    }
  }

  // Métodos privados auxiliares

  private async validateRelatedRecords(
    request: MetaProductoRequest,
  ): Promise<void> {
    // Validar MGA
    const { data: mga, error: mgaError } =
      await this.supabaseService.clientAdmin
        .from('caracterizacion_mga')
        .select('id')
        .eq('id', request.caracterizacion_mga_id)
        .maybeSingle();

    if (mgaError || !mga) {
      throw new BadRequestException({
        status: false,
        message: `No existe una caracterización MGA con el ID ${request.caracterizacion_mga_id}`,
        data: [],
      });
    }

    // Validar Area
    const { data: area, error: areaError } =
      await this.supabaseService.clientAdmin
        .from('area')
        .select('id')
        .eq('id', request.area_id)
        .maybeSingle();

    if (areaError || !area) {
      throw new BadRequestException({
        status: false,
        message: `No existe un área con el ID ${request.area_id}`,
        data: [],
      });
    }

    // Validar ODS
    const { data: ods, error: odsError } =
      await this.supabaseService.clientAdmin
        .from('ods')
        .select('id')
        .eq('id', request.ods_id)
        .maybeSingle();

    if (odsError || !ods) {
      throw new BadRequestException({
        status: false,
        message: `No existe un ODS con el ID ${request.ods_id}`,
        data: [],
      });
    }

    // Validar Enfoque Poblacional
    const { data: enfoque, error: enfoqueError } =
      await this.supabaseService.clientAdmin
        .from('enfoque_poblacional')
        .select('id')
        .eq('id', request.enfoque_poblacional_id)
        .maybeSingle();

    if (enfoqueError || !enfoque) {
      throw new BadRequestException({
        status: false,
        message: `No existe un enfoque poblacional con el ID ${request.enfoque_poblacional_id}`,
        data: [],
      });
    }

    // Validar Meta Resultados
    for (const metaResultadoId of request.meta_resultado_ids) {
      const { data: metaResultado, error: metaResultadoError } =
        await this.supabaseService.clientAdmin
          .from('meta_resultado')
          .select('id')
          .eq('id', metaResultadoId)
          .maybeSingle();

      if (metaResultadoError || !metaResultado) {
        throw new BadRequestException({
          status: false,
          message: `No existe una meta resultado con el ID ${metaResultadoId}`,
          data: [],
        });
      }
    }
  }

  // Crea las relaciones muchos a muchos
  private async createMetaResultadoRelations(
    metaProductoId: number,
    metaResultadoIds: number[],
  ): Promise<void> {
    const relations = metaResultadoIds.map((metaResultadoId) => ({
      meta_producto_id: metaProductoId,
      meta_resultado_id: metaResultadoId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await this.supabaseService.clientAdmin
      .from('metas_resultado_producto')
      .insert(relations);

    if (error) {
      throw new InternalServerErrorException(
        'Error al crear relaciones con meta resultados: ' + error.message,
      );
    }
  }

  private async updateMetaResultadoRelations(
    metaProductoId: number,
    metaResultadoIds: number[],
  ): Promise<void> {
    // Eliminar relaciones existentes
    const { error: deleteError } = await this.supabaseService.clientAdmin
      .from('metas_resultado_producto')
      .delete()
      .eq('meta_producto_id', metaProductoId);

    if (deleteError) {
      throw new InternalServerErrorException(
        'Error al eliminar relaciones existentes: ' + deleteError.message,
      );
    }

    // Crear nuevas relaciones
    await this.createMetaResultadoRelations(metaProductoId, metaResultadoIds);
  }
}
