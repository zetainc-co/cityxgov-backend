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
          // Obtener meta_resultados
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
          }

          // Obtener enfoques poblacionales
          const { data: enfoquesPoblacionales, error: enfoquesError } =
            await this.supabaseService.clientAdmin
              .from('meta_producto_enfoque_poblacional')
              .select('enfoque_poblacional_id')
              .eq('meta_producto_id', metaProducto.id);

          if (enfoquesError) {
            console.error(
              `Error obteniendo enfoques poblacionales para meta_producto ${metaProducto.id}:`,
              enfoquesError,
            );
          }

          return {
            ...metaProducto,
            meta_resultado_ids:
              metaResultados?.map((mr) => mr.meta_resultado_id) || [],
            enfoque_poblacional_ids:
              enfoquesPoblacionales?.map((ep) => ep.enfoque_poblacional_id) || [],
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

      // Obtener solo los IDs de enfoques poblacionales relacionados
      const { data: enfoquesPoblacionales, error: enfoquesError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto_enfoque_poblacional')
          .select('enfoque_poblacional_id')
          .eq('meta_producto_id', id);

      if (enfoquesError) {
        throw new InternalServerErrorException(
          'Error al obtener enfoques poblacionales relacionados: ' +
          enfoquesError.message,
        );
      }

      // Agregar los IDs de meta_resultados y enfoques poblacionales al resultado
      const result = {
        ...data,
        meta_resultado_ids:
          metaResultados?.map((mr) => mr.meta_resultado_id) || [],
        enfoque_poblacional_ids:
          enfoquesPoblacionales?.map((ep) => ep.enfoque_poblacional_id) || [],
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
      // Derivar valores desde la MGA seleccionada (fallbacks)
      let mgaDefaults: { codigo_indicador?: number | null; unidad_medida_indicador_producto?: string | null } = {};
      try {
        const { data: mgaRef } = await this.supabaseService.clientAdmin
          .from('caracterizacion_mga')
          .select('codigo_indicador, unidad_medida_indicador_producto')
          .eq('id', createRequest.caracterizacion_mga_id)
          .maybeSingle();
        if (mgaRef) {
          mgaDefaults.codigo_indicador = mgaRef.codigo_indicador ?? null;
          mgaDefaults.unidad_medida_indicador_producto = (mgaRef.unidad_medida_indicador_producto ?? null) as any;
        }
      } catch {}
      const resolvedCodigoIndicador = createRequest.codigo_indicador_mga ?? (mgaDefaults.codigo_indicador ?? null);
      const resolvedUmi = (createRequest.unidad_medida_indicador_producto || mgaDefaults.unidad_medida_indicador_producto || '').toString().trim();
      const { data: metaProducto, error: createError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto')
          .insert({
            caracterizacion_mga_id: createRequest.caracterizacion_mga_id,
            area_id: createRequest.area_id,
            ods_id: createRequest.ods_id,
            linea_base: createRequest.linea_base,
            instrumento_planeacion: createRequest.instrumento_planeacion.trim(),
            nombre: createRequest.nombre.trim(),
            meta_numerica: createRequest.meta_numerica.trim(),
            orientacion: createRequest.orientacion.trim(),
            enfoque_territorial: createRequest.enfoque_territorial || [],
            codigo_programa: createRequest.codigo_programa?.trim() || '',
            codigo_producto: createRequest.codigo_producto?.trim() || '',
            codigo_sector: createRequest.codigo_sector?.trim() || '',
            unidad_medida: createRequest.unidad_medida?.trim() || '',
            unidad_medida_indicador_producto: resolvedUmi,
            nombre_indicador: createRequest.nombre_indicador?.trim() || '',
            codigo_indicador_mga: resolvedCodigoIndicador !== null && resolvedCodigoIndicador !== undefined ? Number(resolvedCodigoIndicador) : null,
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

      // Crear las relaciones muchos a muchos con meta_resultados
      await this.createMetaResultadoRelations(
        metaProducto.id,
        createRequest.meta_resultado_ids,
      );

      // Crear las relaciones muchos a muchos con enfoques poblacionales
      if (createRequest.enfoque_poblacional_ids && createRequest.enfoque_poblacional_ids.length > 0) {
        await this.createEnfoquePoblacionalRelations(
          metaProducto.id,
          createRequest.enfoque_poblacional_ids,
        );
      }

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

      // Obtener solo los IDs de enfoques poblacionales relacionados
      const { data: enfoquesPoblacionales, error: enfoquesError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto_enfoque_poblacional')
          .select('enfoque_poblacional_id')
          .eq('meta_producto_id', metaProducto.id);

      if (enfoquesError) {
        throw new InternalServerErrorException(
          'Error al obtener enfoques poblacionales relacionados: ' +
          enfoquesError.message,
        );
      }

      // Agregar los IDs de meta_resultados y enfoques poblacionales al resultado
      const result = {
        ...metaProducto,
        meta_resultado_ids:
          metaResultados?.map((mr) => mr.meta_resultado_id) || [],
        enfoque_poblacional_ids:
          enfoquesPoblacionales?.map((ep) => ep.enfoque_poblacional_id) || [],
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
        existing.linea_base !== updateRequest.linea_base ||
        existing.instrumento_planeacion !==
        updateRequest.instrumento_planeacion.trim() ||
        existing.nombre !== updateRequest.nombre.trim() ||
        existing.meta_numerica !== updateRequest.meta_numerica.trim() ||
        existing.orientacion !== updateRequest.orientacion.trim() ||
        JSON.stringify(existing.enfoque_territorial) !== JSON.stringify(updateRequest.enfoque_territorial || []) ||
        existing.codigo_programa !== (updateRequest.codigo_programa?.trim() || '') ||
        existing.codigo_producto !== (updateRequest.codigo_producto?.trim() || '') ||
        existing.codigo_sector !== (updateRequest.codigo_sector?.trim() || '') ||
        existing.unidad_medida !== (updateRequest.unidad_medida?.trim() || '') ||
        existing.unidad_medida_indicador_producto !== (updateRequest.unidad_medida_indicador_producto?.trim() || '') ||
        existing.nombre_indicador !== (updateRequest.nombre_indicador?.trim() || '') ||
        Number(existing.codigo_indicador_mga ?? 0) !== Number(updateRequest.codigo_indicador_mga ?? existing.codigo_indicador_mga ?? 0);

      // Obtener enfoques poblacionales actuales para comparar
      const { data: currentEnfoques, error: currentEnfoquesError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto_enfoque_poblacional')
          .select('enfoque_poblacional_id')
          .eq('meta_producto_id', id);

      if (currentEnfoquesError) {
        throw new InternalServerErrorException(
          'Error al obtener enfoques poblacionales actuales: ' +
          currentEnfoquesError.message,
        );
      }

      const currentEnfoqueIds =
        currentEnfoques?.map((ep) => ep.enfoque_poblacional_id) || [];
      const newEnfoqueIds = [...(updateRequest.enfoque_poblacional_ids || [])].sort();
      const currentEnfoqueIdsSorted = [...currentEnfoqueIds].sort();

      // Verificar cambios en meta_resultado_ids
      const hasMetaResultadoChanges =
        JSON.stringify(newMetaResultadoIds) !==
        JSON.stringify(currentMetaResultadoIdsSorted);

      // Verificar cambios en enfoque_poblacional_ids
      const hasEnfoquePoblacionalChanges =
        JSON.stringify(newEnfoqueIds) !==
        JSON.stringify(currentEnfoqueIdsSorted);

      if (!hasBasicChanges && !hasMetaResultadoChanges && !hasEnfoquePoblacionalChanges) {
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
          status: true,
          message: 'Meta producto actualizado correctamente (sin cambios detectados)',
          data: [result],
        };
      }

      // Actualizar meta_producto solo si hay cambios básicos
      if (hasBasicChanges) {
        // Derivar defaults desde MGA si no vienen en request
        let updateResolvedCodigo = updateRequest.codigo_indicador_mga;
        let updateResolvedUmi = updateRequest.unidad_medida_indicador_producto;
        if (!updateResolvedCodigo || !updateResolvedUmi) {
          try {
            const { data: mgaRef } = await this.supabaseService.clientAdmin
              .from('caracterizacion_mga')
              .select('codigo_indicador, unidad_medida_indicador_producto')
              .eq('id', updateRequest.caracterizacion_mga_id)
              .maybeSingle();
            if (!updateResolvedCodigo && mgaRef?.codigo_indicador) updateResolvedCodigo = Number(mgaRef.codigo_indicador);
            if (!updateResolvedUmi && mgaRef?.unidad_medida_indicador_producto) updateResolvedUmi = String(mgaRef.unidad_medida_indicador_producto);
          } catch {}
        }
        const { data: updatedData, error: updatedError } =
          await this.supabaseService.clientAdmin
            .from('meta_producto')
            .update({
              caracterizacion_mga_id: updateRequest.caracterizacion_mga_id,
              area_id: updateRequest.area_id,
              ods_id: updateRequest.ods_id,
              linea_base: updateRequest.linea_base,
              instrumento_planeacion:
                updateRequest.instrumento_planeacion.trim(),
              nombre: updateRequest.nombre.trim(),
              meta_numerica: updateRequest.meta_numerica.trim(),
              orientacion: updateRequest.orientacion.trim(),
              enfoque_territorial: updateRequest.enfoque_territorial || [],
              codigo_programa: updateRequest.codigo_programa?.trim() || '',
              codigo_producto: updateRequest.codigo_producto?.trim() || '',
              codigo_sector: updateRequest.codigo_sector?.trim() || '',
              unidad_medida: updateRequest.unidad_medida?.trim() || '',
              unidad_medida_indicador_producto: (updateResolvedUmi || '').toString().trim(),
              nombre_indicador: updateRequest.nombre_indicador?.trim() || '',
              codigo_indicador_mga: updateResolvedCodigo !== undefined && updateResolvedCodigo !== null ? Number(updateResolvedCodigo) : existing.codigo_indicador_mga ?? null,
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

      // Actualizar relaciones muchos a muchos si hay cambios
      if (hasEnfoquePoblacionalChanges && updateRequest.enfoque_poblacional_ids) {
        await this.updateEnfoquePoblacionalRelations(
          id,
          updateRequest.enfoque_poblacional_ids,
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

      console.log('🔍 Meta producto actualizado:', metaProductoUpdated);

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

      // Obtener solo los IDs de enfoques poblacionales relacionados
      const { data: enfoquesPoblacionales, error: enfoquesError } =
        await this.supabaseService.clientAdmin
          .from('meta_producto_enfoque_poblacional')
          .select('enfoque_poblacional_id')
          .eq('meta_producto_id', id);

      if (enfoquesError) {
        throw new InternalServerErrorException(
          'Error al obtener enfoques poblacionales relacionados: ' +
          enfoquesError.message,
        );
      }

      // Agregar los IDs de meta_resultados y enfoques poblacionales al resultado
      const result = {
        ...metaProductoUpdated,
        meta_resultado_ids:
          metaResultados?.map((mr) => mr.meta_resultado_id) || [],
        enfoque_poblacional_ids:
          enfoquesPoblacionales?.map((ep) => ep.enfoque_poblacional_id) || [],
      };

      console.log('✅ Resultado final del update:', {
        status: true,
        message: 'Meta producto actualizado correctamente',
        data: [result],
      });

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

      // Eliminar relaciones de enfoques poblacionales
      const { error: enfoquesError } = await this.supabaseService.clientAdmin
        .from('meta_producto_enfoque_poblacional')
        .delete()
        .eq('meta_producto_id', id);

      if (enfoquesError) {
        throw new InternalServerErrorException(
          'Error al eliminar relaciones de enfoques poblacionales: ' + enfoquesError.message,
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

    // Validar Enfoque Poblacional (opcional) - viene del modulo enfoque_poblacional
    if (request.enfoque_poblacional_ids && Array.isArray(request.enfoque_poblacional_ids) && request.enfoque_poblacional_ids.length > 0) {
      for (const enfoqueId of request.enfoque_poblacional_ids) {
    const { data: enfoque, error: enfoqueError } =
      await this.supabaseService.clientAdmin
        .from('enfoque_poblacional')
        .select('id')
            .eq('id', enfoqueId)
        .maybeSingle();

    if (enfoqueError || !enfoque) {
          throw new BadRequestException({
            status: false,
            message: `No existe un enfoque poblacional con el ID ${enfoqueId}`,
            data: [],
          });
        }
      }
    }

    // Validar Enfoque Territorial (obligatorio) - solo valores 1 (Urbano) o 2 (Rural)
    if (!request.enfoque_territorial || !Array.isArray(request.enfoque_territorial) || request.enfoque_territorial.length === 0) {
      throw new BadRequestException({
        status: false,
        message: 'Debe seleccionar al menos un enfoque territorial',
        data: [],
      });
    }

    // Validar que solo contenga valores 1 o 2
    const valoresValidos = [1, 2];
    const valoresInvalidos = request.enfoque_territorial.filter(id => !valoresValidos.includes(id));

    if (valoresInvalidos.length > 0) {
      throw new BadRequestException({
        status: false,
        message: 'Los valores de enfoque territorial solo pueden ser 1 (Urbano) o 2 (Rural)',
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

  private async createEnfoquePoblacionalRelations(
    metaProductoId: number,
    enfoquePoblacionalIds: number[],
  ): Promise<void> {
    const relations = enfoquePoblacionalIds.map((enfoqueId) => ({
      meta_producto_id: metaProductoId,
      enfoque_poblacional_id: enfoqueId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await this.supabaseService.clientAdmin
      .from('meta_producto_enfoque_poblacional')
      .insert(relations);

    if (error) {
      throw new InternalServerErrorException(
        'Error al crear relaciones con enfoques poblacionales: ' + error.message,
      );
    }
  }

  private async updateEnfoquePoblacionalRelations(
    metaProductoId: number,
    enfoquePoblacionalIds: number[],
  ): Promise<void> {
    // Eliminar relaciones existentes
    const { error: deleteError } = await this.supabaseService.clientAdmin
      .from('meta_producto_enfoque_poblacional')
      .delete()
      .eq('meta_producto_id', metaProductoId);

    if (deleteError) {
      throw new InternalServerErrorException(
        'Error al eliminar relaciones existentes: ' + deleteError.message,
      );
    }

    // Crear nuevas relaciones
    await this.createEnfoquePoblacionalRelations(metaProductoId, enfoquePoblacionalIds);
  }
}
