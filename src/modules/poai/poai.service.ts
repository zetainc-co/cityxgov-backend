import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
  } from '@nestjs/common';
  import {
    PoaiRequest,
    PoaiUpdateRequest,
    PoaiResponse,
    PoaiCompletoData,
    PoaiUpdateData,
  } from './dto/poai.dto';
  import { SupabaseService } from '../../config/supabase/supabase.service';

  @Injectable()
  export class PoaiService {
    constructor(private supabaseService: SupabaseService) { }

    // ================================================================
    // CONSULTA COMPLETA DEL POAI POR AÑO CON JOINs
    // ================================================================
    async getPoaiCompletoByYear(año: number): Promise<PoaiResponse> {
      try {
        // Mapear año a período
        const mapeoPeriodos = {
          2024: 1,
          2025: 2,
          2026: 3,
          2027: 4
        };

        const periodo = mapeoPeriodos[año];

        if (!periodo) {
          return {
            status: false,
            message: `Año ${año} no válido. Solo se permiten años entre 2024-2027`,
            error: 'AÑO_INVALIDO',
          };
        }

        // Verificar si existe POAI para el año
        const { data: poai, error: poaiError } = await this.supabaseService.clientAdmin
          .from('poai')
          .select('*')
          .eq('periodo', periodo)
          .maybeSingle();

        if (poaiError) {
          throw new InternalServerErrorException(
            'Error al obtener POAI: ' + poaiError.message,
          );
        }

        if (!poai) {
          return {
            status: false,
            message: `No existe un POAI para el año ${año} (periodo ${periodo})`,
            error: 'POAI_NO_ENCONTRADO',
          };
        }

        // Obtener toda la información usando JOINs
        const poaiCompleto = await this.getPoaiCompletoWithJoins(poai, periodo);

        return {
          status: true,
          message: `POAI del año ${año} (periodo ${periodo}) cargado correctamente`,
          data: poaiCompleto,
        };
      } catch (error) {
        return {
          status: false,
          message: 'Error al cargar POAI completo por año',
          error: error.message,
        };
      }
    }

    // Método privado para obtener datos completos con JOINs
    private async getPoaiCompletoWithJoins(poai: any, periodo: number): Promise<PoaiCompletoData> {
      // Mapear período a campo de período
      const mapeoPeriodos = {
        1: 'periodo_uno',
        2: 'periodo_dos',
        3: 'periodo_tres',
        4: 'periodo_cuatro'
      };

      const periodoCampo = mapeoPeriodos[periodo];

      // 1. Obtener topes presupuestales del período
      const { data: topesPresupuestales, error: topesError } = await this.supabaseService.clientAdmin
        .from('topes_presupuestales')
        .select(`
          *,
          fuentes_financiacion(
            id,
            nombre,
            marco_normativo
          )
        `)
        .eq('periodo', periodo)
        .order('fuente_id');

      // 2. Obtener banco de proyectos del período
      const { data: bancoProyectos, error: bancoError } = await this.supabaseService.clientAdmin
        .from('banco_proyectos')
        .select(`
          *,
          proyecto_metas(
            meta_producto_id,
            meta_producto(
              id,
              nombre,
              caracterizacion_mga(
                programa,
                producto,
                descripcion_producto
              )
            )
          )
        `)
        .eq('periodo', periodo)
        .order('created_at', { ascending: false });

      // 3. Obtener programación financiera del período específico
      const { data: programacionFinanciera } = await this.supabaseService.clientAdmin
        .from('programacion_financiera')
        .select(`
          *,
          fuente_financiacion:fuente_id(
            id,
            nombre,
            marco_normativo
          ),
          meta_producto:meta_id(
            id,
            nombre,
            caracterizacion_mga(
              programa,
              producto
            )
          )
        `)
        .gt(periodoCampo, 0)
        .order('meta_id');

      // 4. Obtener programación física del período específico
      const { data: programacionFisica } = await this.supabaseService.clientAdmin
        .from('programacion_fisica')
        .select(`
          *,
          meta_producto:meta_id(
            id,
            nombre,
            caracterizacion_mga(
              programa,
              producto
            )
          )
        `)
        .gt(periodoCampo, 0)
        .order('meta_id');

      // 5. Obtener todas las fuentes de financiación disponibles
      const { data: fuentesFinanciacion } = await this.supabaseService.clientAdmin
        .from('fuentes_financiacion')
        .select('*')
        .order('nombre');

      // 6. Calcular resumen ejecutivo
      const resumenEjecutivo = await this.calcularResumenEjecutivo(
        topesPresupuestales || [],
        bancoProyectos || [],
        programacionFinanciera || [],
        periodoCampo
      );

      return {
        poai: {
          ...poai,
          resumen_ejecutivo: resumenEjecutivo
        },
        topes_presupuestales: topesPresupuestales || [],
        banco_proyectos: bancoProyectos || [],
        programacion_financiera: programacionFinanciera || [],
        programacion_fisica: programacionFisica || [],
        fuentes_financiacion: fuentesFinanciacion || []
      };
    }

    // Método para calcular resumen ejecutivo
    private async calcularResumenEjecutivo(
      topes: any[],
      proyectos: any[],
      programacionFinanciera: any[],
      periodoCampo: string
    ): Promise<any> {
      // Calcular total presupuesto (suma de topes)
      const totalPresupuesto = topes.reduce((sum, tope) => sum + Number(tope.tope_maximo), 0);

      // Calcular total asignado (suma de programación financiera del período)
      const totalAsignado = programacionFinanciera.reduce((sum, prog) => {
        return sum + Number(prog[periodoCampo] || 0);
      }, 0);

      // Calcular número de proyectos
      const numeroProyectos = proyectos.length;

      // Calcular porcentaje de ejecución
      const porcentajeEjecucion = totalPresupuesto > 0 ? (totalAsignado / totalPresupuesto) * 100 : 0;

      return {
        total_presupuesto: totalPresupuesto,
        total_asignado: totalAsignado,
        disponible: totalPresupuesto - totalAsignado,
        numero_proyectos: numeroProyectos,
        porcentaje_ejecucion: Math.round(porcentajeEjecucion * 100) / 100
      };
    }

    // ================================================================
    // CRUD BÁSICO
    // ================================================================

    // Crear POAI
    async create(createRequest: PoaiRequest): Promise<PoaiResponse> {
      try {
        // Verificar si ya existe un POAI para el período
        const { data: existingPoai } = await this.supabaseService.clientAdmin
          .from('poai')
          .select('id')
          .eq('periodo', createRequest.año)
          .maybeSingle();

        if (existingPoai) {
          return {
            status: false,
            message: `Ya existe un POAI para el año ${createRequest.año}`,
            error: 'POAI_DUPLICATE',
          };
        }

        const { data: poai, error } = await this.supabaseService.clientAdmin
          .from('poai')
          .insert({
            periodo: createRequest.año
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Error al crear POAI: ${error.message}`);
        }

        return {
          status: true,
          message: 'POAI creado correctamente',
          data: poai,
        };
      } catch (error) {
        return {
          status: false,
          message: 'Error al crear POAI',
          error: error.message,
        };
      }
    }

    // Obtener todos los POAIs
    async findAll(): Promise<PoaiResponse> {
      try {
        const { data: poais, error } = await this.supabaseService.clientAdmin
          .from('poai')
          .select('*')
          .order('periodo', { ascending: false });

        if (error) {
          throw new InternalServerErrorException(
            'Error al obtener POAIs: ' + error.message,
          );
        }

        return {
          status: true,
          message: 'POAIs encontrados correctamente',
          data: poais || [],
        };
      } catch (error) {
        return {
          status: false,
          message: 'Error al obtener POAIs',
          error: error.message,
        };
      }
    }

    // Obtener un POAI por ID
    async findOne(id: number): Promise<PoaiResponse> {
      try {
        const { data, error } = await this.supabaseService.clientAdmin
          .from('poai')
          .select('*')
          .eq('id', id)
          .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener POAI: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un POAI con el ID ${id}`,
          error: 'ID no encontrado',
        };
      }

      return {
        status: true,
        message: 'POAI encontrado correctamente',
        data: data,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener POAI',
        error: error.message,
      };
    }
  }

  // Actualizar POAI
  async update(id: number, updateRequest: PoaiUpdateRequest): Promise<PoaiResponse> {
    try {
      // Verificar si existe el POAI
      const { data: existingPoai } = await this.supabaseService.clientAdmin
        .from('poai')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (!existingPoai) {
        return {
          status: false,
          message: `No existe un POAI con el ID ${id}`,
          error: 'ID no encontrado',
        };
      }

      // Preparar datos para actualizar
      const updateData: any = {};
      if (updateRequest.año !== undefined) {
        updateData.periodo = updateRequest.año;
      }

      const { data: poai, error } = await this.supabaseService.clientAdmin
        .from('poai')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException(
          'Error al actualizar POAI: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'POAI actualizado correctamente',
        data: poai,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al actualizar POAI',
        error: error.message,
      };
    }
  }

    // Eliminar POAI
    async delete(id: number): Promise<PoaiResponse> {
      try {
        const { data: existingPoai } = await this.supabaseService.clientAdmin
          .from('poai')
          .select('id')
          .eq('id', id)
          .maybeSingle();

        if (!existingPoai) {
          return {
            status: false,
            message: `No existe un POAI con el ID ${id}`,
            error: 'ID no encontrado',
          };
        }

        const { error } = await this.supabaseService.clientAdmin
          .from('poai')
          .delete()
          .eq('id', id);

        if (error) {
          throw new InternalServerErrorException(
            'Error al eliminar POAI: ' + error.message,
          );
        }

        return {
          status: true,
          message: 'POAI eliminado correctamente',
        };
      } catch (error) {
        return {
          status: false,
          message: 'Error al eliminar POAI',
          error: error.message,
        };
      }
    }

  // ================================================================
  // ACTUALIZACIÓN CON TRAZABILIDAD
  // ================================================================

  // Actualizar POAI completo con trazabilidad
  async updatePoaiWithTraceability(
    año: number,
    usuarioId: number,
    cambios: any
  ): Promise<PoaiResponse> {
    try {
      // Mapear año a período
      const mapeoPeriodos = {
        2024: 1,
        2025: 2,
        2026: 3,
        2027: 4
      };

      const periodo = mapeoPeriodos[año];

      if (!periodo) {
        return {
          status: false,
          message: `Año ${año} no válido. Solo se permiten años entre 2024-2027`,
          error: 'AÑO_INVALIDO',
        };
      }

      // Verificar si existe POAI para el año
      const { data: poai, error: poaiError } = await this.supabaseService.clientAdmin
        .from('poai')
        .select('*')
        .eq('periodo', periodo)
        .maybeSingle();

      if (poaiError || !poai) {
        return {
          status: false,
          message: `No existe un POAI para el año ${año} (periodo ${periodo})`,
          error: 'POAI_NO_ENCONTRADO',
        };
      }

      // Llamar a la función de base de datos para actualización con trazabilidad
      const { data: result, error } = await this.supabaseService.clientAdmin.rpc(
        'update_poai_complete_with_traceability',
        {
          p_poai_id: poai.id,
          p_user_id: usuarioId,
          p_update_data: cambios,
          p_periodo: periodo
        }
      );

      if (error) {
        throw new InternalServerErrorException(
          'Error al actualizar POAI con trazabilidad: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'POAI actualizado correctamente con trazabilidad',
        data: {
          poai_actualizado: poai,
          resumen_cambios: result.resumen_cambios,
          historial_creado: true
        },
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al actualizar POAI con trazabilidad',
        error: error.message,
      };
    }
  }

  // ================================================================
  // CONSULTA DE HISTORIAL
  // ================================================================

  // Obtener historial de cambios de un POAI
  async getHistorialCambios(
    año: number,
    tipoCambio?: string,
    fechaDesde?: string,
    fechaHasta?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PoaiResponse> {
    try {
      // Mapear año a período
      const mapeoPeriodos = {
        2024: 1,
        2025: 2,
        2026: 3,
        2027: 4
      };

      const periodo = mapeoPeriodos[año];

      if (!periodo) {
        return {
          status: false,
          message: `Año ${año} no válido. Solo se permiten años entre 2024-2027`,
          error: 'AÑO_INVALIDO',
        };
      }

      // Obtener POAI del período
      const { data: poai } = await this.supabaseService.clientAdmin
        .from('poai')
        .select('id')
        .eq('periodo', periodo)
        .maybeSingle();

      if (!poai) {
        return {
          status: false,
          message: `No existe un POAI para el año ${año} (periodo ${periodo})`,
          error: 'POAI_NO_ENCONTRADO',
        };
      }

      // Construir consulta base
      let query = this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          *,
          usuario:usuarios(
            id,
            nombre,
            email
          )
        `)
        .eq('poai_id', poai.id)
        .order('fecha_cambio', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros adicionales
      if (tipoCambio) {
        query = query.eq('tipo_cambio', tipoCambio);
      }

      if (fechaDesde) {
        query = query.gte('fecha_cambio', fechaDesde);
      }

      if (fechaHasta) {
        query = query.lte('fecha_cambio', fechaHasta);
      }

      const { data: historial, error } = await query;

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener historial: ' + error.message,
        );
      }

      // Obtener total de registros para paginación
      let countQuery = this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select('id', { count: 'exact' })
        .eq('poai_id', poai.id);

      if (tipoCambio) {
        countQuery = countQuery.eq('tipo_cambio', tipoCambio);
      }

      if (fechaDesde) {
        countQuery = countQuery.gte('fecha_cambio', fechaDesde);
      }

      if (fechaHasta) {
        countQuery = countQuery.lte('fecha_cambio', fechaHasta);
      }

      const { count: totalRegistros } = await countQuery;

      // Calcular resumen por tipo de cambio
      const resumenPorTipo = {};
      if (historial) {
        historial.forEach(cambio => {
          const tipo = cambio.tipo_cambio;
          resumenPorTipo[tipo] = (resumenPorTipo[tipo] || 0) + 1;
        });
      }

      return {
        status: true,
        message: `Historial de cambios del POAI ${año} obtenido correctamente`,
        data: {
          historial: historial || [],
          total_registros: totalRegistros || 0,
          resumen_por_tipo: resumenPorTipo
        },
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener historial de cambios',
        error: error.message,
      };
    }
  }

  // ================================================================
  // GENERACIÓN DE REPORTES
  // ================================================================

  // Generar reporte de cambios para un período
  async generarReporteCambios(año: number): Promise<PoaiResponse> {
    try {
      // Mapear año a período
      const mapeoPeriodos = {
        2024: 1,
        2025: 2,
        2026: 3,
        2027: 4
      };

      const periodo = mapeoPeriodos[año];

      if (!periodo) {
        return {
          status: false,
          message: `Año ${año} no válido. Solo se permiten años entre 2024-2027`,
          error: 'AÑO_INVALIDO',
        };
      }

      // Obtener POAI del período
      const { data: poai } = await this.supabaseService.clientAdmin
        .from('poai')
        .select('id')
        .eq('periodo', periodo)
        .maybeSingle();

      if (!poai) {
        return {
          status: false,
          message: `No existe un POAI para el año ${año} (periodo ${periodo})`,
          error: 'POAI_NO_ENCONTRADO',
        };
      }

      // Obtener historial de cambios
      const { data: historial } = await this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select('*')
        .eq('poai_id', poai.id)
        .order('fecha_cambio', { ascending: false });

      // Obtener datos actuales del POAI
      const poaiCompleto = await this.getPoaiCompletoWithJoins(poai, periodo);

      // Calcular cambios por módulo
      const cambiosPorModulo = {
        banco_proyectos: 0,
        topes_presupuestales: 0,
        programacion_financiera: 0,
        programacion_fisica: 0
      };

      if (historial) {
        historial.forEach(cambio => {
          const modulo = cambio.modulo_afectado;
          if (cambiosPorModulo.hasOwnProperty(modulo)) {
            cambiosPorModulo[modulo]++;
          }
        });
      }

      // Limpiar historial para mostrar solo información relevante
      const historialLimpio = historial?.map(cambio => ({
        id: cambio.id,
        tipo_cambio: cambio.tipo_cambio,
        modulo_afectado: cambio.modulo_afectado,
        fecha_cambio: cambio.fecha_cambio,
        descripcion_cambio: cambio.descripcion_cambio,
        datos_anteriores: cambio.datos_anteriores,
        datos_nuevos: cambio.datos_nuevos
      })) || [];

      const reporte = {
        periodo: periodo,
        fecha_generacion: new Date().toISOString(),
        resumen_ejecutivo: poaiCompleto.poai.resumen_ejecutivo,
        cambios_por_modulo: cambiosPorModulo,
        cambios_detallados: historialLimpio
      };

      return {
        status: true,
        message: `Reporte de cambios del POAI ${año} generado correctamente`,
        data: reporte,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al generar reporte de cambios',
        error: error.message,
      };
    }
  }

  // ================================================================
  // HISTORIAL GENERAL (SIN AÑO ESPECÍFICO)
  // ================================================================

  // Obtener todo el historial de cambios (sin año específico)
  async getAllHistorialCambios(
    tipoCambio?: string,
    fechaDesde?: string,
    fechaHasta?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PoaiResponse> {
    try {
      // Construir consulta base
      let query = this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          *,
          usuario:usuarios(
            id,
            nombre,
            email
          ),
          poai:poai(
            id,
            periodo
          )
        `)
        .order('fecha_cambio', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros adicionales
      if (tipoCambio) {
        query = query.eq('tipo_cambio', tipoCambio);
      }

      if (fechaDesde) {
        query = query.gte('fecha_cambio', fechaDesde);
      }

      if (fechaHasta) {
        query = query.lte('fecha_cambio', fechaHasta);
      }

      const { data: historial, error } = await query;

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener historial: ' + error.message,
        );
      }

      // Obtener total de registros para paginación
      let countQuery = this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select('id', { count: 'exact' });

      if (tipoCambio) {
        countQuery = countQuery.eq('tipo_cambio', tipoCambio);
      }

      if (fechaDesde) {
        countQuery = countQuery.gte('fecha_cambio', fechaDesde);
      }

      if (fechaHasta) {
        countQuery = countQuery.lte('fecha_cambio', fechaHasta);
      }

      const { count: totalRegistros } = await countQuery;

      // Calcular resumen por tipo de cambio
      const resumenPorTipo = {};
      if (historial) {
        historial.forEach(cambio => {
          const tipo = cambio.tipo_cambio;
          resumenPorTipo[tipo] = (resumenPorTipo[tipo] || 0) + 1;
        });
      }

      return {
        status: true,
        message: `Historial general de cambios obtenido correctamente`,
        data: {
          historial: historial || [],
          total_registros: totalRegistros || 0,
          resumen_por_tipo: resumenPorTipo
        },
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener historial general de cambios',
        error: error.message,
      };
    }
  }

  // Generar reporte general de cambios (sin año específico)
  async generarReporteGeneralCambios(): Promise<PoaiResponse> {
    try {
      // Obtener todo el historial de cambios
      const { data: historial } = await this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          *,
          poai:poai(
            id,
            periodo
          )
        `)
        .order('fecha_cambio', { ascending: false });

      // Calcular cambios por módulo
      const cambiosPorModulo = {
        banco_proyectos: 0,
        topes_presupuestales: 0,
        programacion_financiera: 0,
        programacion_fisica: 0
      };

      // Calcular resumen ejecutivo general
      const resumenEjecutivo = {
        total_presupuesto: 0,
        total_asignado: 0,
        disponible: 0,
        numero_proyectos: 0,
        porcentaje_ejecucion: 0
      };

      if (historial) {
        historial.forEach(cambio => {
          const modulo = cambio.modulo_afectado;
          if (cambiosPorModulo.hasOwnProperty(modulo)) {
            cambiosPorModulo[modulo]++;
          }
        });
      }

      // Limpiar historial para mostrar solo información relevante
      const historialLimpio = historial?.map(cambio => ({
        id: cambio.id,
        tipo_cambio: cambio.tipo_cambio,
        modulo_afectado: cambio.modulo_afectado,
        fecha_cambio: cambio.fecha_cambio,
        descripcion_cambio: cambio.descripcion_cambio,
        datos_anteriores: cambio.datos_anteriores,
        datos_nuevos: cambio.datos_nuevos,
        poai_periodo: cambio.poai?.periodo
      })) || [];

      const reporte = {
        periodo: null, // General, no específico
        fecha_generacion: new Date().toISOString(),
        resumen_ejecutivo: resumenEjecutivo,
        cambios_por_modulo: cambiosPorModulo,
        cambios_detallados: historialLimpio
      };

      return {
        status: true,
        message: `Reporte general de cambios generado correctamente`,
        data: reporte,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al generar reporte general de cambios',
        error: error.message,
      };
    }
  }
}
