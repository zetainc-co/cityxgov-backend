import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase/supabase.service';
import {
  ReportePeriodoRequest,
  ReportePeriodoResponse,
  ReporteHistorialResponse,
  ReporteByIdResponse,
  ReportesListResponse,
  ReportesFiltrosRequest,
  GenerarReporteExcelRequest,
  GenerarReporteExcelResponse,
  ReporteExcelRow,
} from './dto/reportes-poai.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportesPoaiService {
  constructor(private supabaseService: SupabaseService) { }

  // Generar reporte de periodo POAI
  async generarReportePeriodo(
    año: number,
    usuarioId: number,
  ): Promise<ReportePeriodoResponse> {
    try {
      const { data: result, error } = await this.supabaseService.clientAdmin.rpc(
        'generar_reporte_periodo_poai',
        {
          p_año: año,
          p_user_id: usuarioId,
        },
      );

      if (error) {
        throw new InternalServerErrorException(
          'Error al generar reporte del periodo: ' + error.message,
        );
      }

      return {
        status: true,
        message: `Reporte del periodo ${año} generado correctamente`,
        data: result,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al generar reporte del periodo',
        error: error.message,
      };
    }
  }

  // Obtener historial de reportes por periodo
  async getHistorialReportes(año: number): Promise<ReporteHistorialResponse> {
    try {
      // Mapear año a período
      const mapeoPeriodos = {
        2024: 1,
        2025: 2,
        2026: 3,
        2027: 4,
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
      const { data: poai, error: poaiError } = await this.supabaseService.clientAdmin
        .from('poai')
        .select('id')
        .eq('periodo', periodo)
        .maybeSingle();

      if (poaiError || !poai) {
        return {
          status: false,
          message: `No existe un POAI para el año ${año} (periodo ${periodo})`,
          error: 'POAI_NO_ENCONTRADO',
        };
      }

      // Obtener historial de reportes
      const { data: historial, error: historialError } = await this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          id,
          poai_id,
          usuario_id,
          fecha_cambio,
          datos_poai,
          usuario:usuarios(
            id,
            nombre,
            apellido,
            correo,
            identificacion
          ),
          poai:poai(
            id,
            periodo,
            created_at,
            updated_at
          )
        `)
        .eq('poai_id', poai.id)
        .order('fecha_cambio', { ascending: false });

      if (historialError) {
        throw new InternalServerErrorException(
          'Error al obtener historial de reportes: ' + historialError.message,
        );
      }

      return {
        status: true,
        message: `Historial de reportes del año ${año} obtenido correctamente`,
        data: {
          historial: (historial || []) as any,
          total_reportes: historial?.length || 0,
          periodo: periodo,
          año: año,
        },
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener historial de reportes',
        error: error.message,
      };
    }
  }

  // Obtener reporte por ID
  async getReporteById(id: number): Promise<ReporteByIdResponse> {
    try {
      const { data: reporte, error } = await this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          id,
          poai_id,
          usuario_id,
          fecha_cambio,
          datos_poai,
          usuario:usuarios(
            id,
            nombre,
            apellido,
            correo,
            identificacion
          ),
          poai:poai(
            id,
            periodo,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener reporte: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Reporte obtenido correctamente',
        data: reporte as any,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener reporte',
        error: error.message,
      };
    }
  }

  // Obtener todos los reportes
  async getAllReportes(): Promise<ReportesListResponse> {
    try {
      const { data: reportes, error } = await this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          id,
          poai_id,
          usuario_id,
          fecha_cambio,
          datos_poai,
          usuario:usuarios(
            id,
            nombre,
            apellido,
            correo,
            identificacion
          ),
          poai:poai(
            id,
            periodo,
            created_at,
            updated_at
          )
        `)
        .order('fecha_cambio', { ascending: false });

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener reportes: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Reportes obtenidos correctamente',
        data: {
          reportes: (reportes || []) as any,
          total_reportes: reportes?.length || 0,
        },
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener reportes',
        error: error.message,
      };
    }
  }

  // Obtener reportes con filtros
  async getReportesFiltrados(filtros: ReportesFiltrosRequest): Promise<ReportesListResponse> {
    try {
      let query = this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          id,
          poai_id,
          usuario_id,
          fecha_cambio,
          datos_poai,
          usuario:usuarios(
            id,
            nombre,
            apellido,
            correo,
            identificacion
          ),
          poai:poai(
            id,
            periodo,
            created_at,
            updated_at
          )
        `);

            // Aplicar filtro de fecha específica
      if (filtros.fechaEspecifica) {
        // Crear fechas en zona horaria local
        const [year, month, day] = filtros.fechaEspecifica.split('-').map(Number);

        // Fecha inicio: 00:00:00 del día seleccionado en zona local
        const fechaInicio = new Date(year, month - 1, day, 0, 0, 0, 0);

        // Fecha fin: 23:59:59 del día seleccionado en zona local
        const fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);

        console.log('🔍 Filtro de fecha:', {
          fechaRecibida: filtros.fechaEspecifica,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          fechaInicioLocal: fechaInicio.toLocaleString(),
          fechaFinLocal: fechaFin.toLocaleString()
        });

        query = query
          .gte('fecha_cambio', fechaInicio.toISOString())
          .lte('fecha_cambio', fechaFin.toISOString());
      }

      const { data: reportes, error } = await query.order('fecha_cambio', { ascending: false });

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener reportes filtrados: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Reportes filtrados obtenidos correctamente',
        data: {
          reportes: (reportes || []) as any,
          total_reportes: reportes?.length || 0,
        },
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener reportes filtrados',
        error: error.message,
      };
    }
  }

  // Obtener todos los historiales disponibles
  async getHistorialesDisponibles(): Promise<ReportesListResponse> {
    try {
      const { data: historiales, error } = await this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          id,
          poai_id,
          usuario_id,
          fecha_cambio,
          usuario:usuarios(
            id,
            nombre,
            apellido,
            correo,
            identificacion
          ),
          poai:poai!inner(
            id,
            periodo
          )
        `)
        .order('fecha_cambio', { ascending: false });

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener historiales: ' + error.message,
        );
      }

            // Mapear período a año para mejor comprensión
      const historialesConAño = historiales?.map((historial: any) => ({
        ...historial,
        año: historial.poai?.periodo === 1 ? 2024 :
             historial.poai?.periodo === 2 ? 2025 :
             historial.poai?.periodo === 3 ? 2026 :
             historial.poai?.periodo === 4 ? 2027 : 'N/A'
      })) || [];

      return {
        status: true,
        message: 'Historiales obtenidos correctamente',
        data: {
          reportes: historialesConAño,
          total_reportes: historialesConAño.length,
        },
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener historiales',
        error: error.message,
      };
    }
  }

    async generarReportePoai(historialId: number): Promise<Buffer> {
    try {
      console.log(`🔍 Generando reporte para historial ID: ${historialId}`);

      // Como la función RPC no existe, usar directamente el método que sí funciona
      console.log(`📊 Usando método directo para generar reporte`);
      return await this.generarReportePoaiDirecto(historialId);

    } catch (error) {
      throw new Error(`Error generando reporte: ${error.message}`);
    }
  }

  // Versión alternativa usando consulta directa (sin función almacenada)
  async generarReportePoaiDirecto(historialId: number): Promise<Buffer> {
    try {
      // Obtener datos del historial primero
      const { data: historialData, error: historialError } = await this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select('datos_poai, poai!inner(periodo)')
        .eq('id', historialId)
        .single();

      if (historialError) {
        throw new Error(`Error obteniendo historial: ${historialError.message}`);
      }

      const periodo = (historialData.poai as any)?.periodo;
      const datosPoai = historialData.datos_poai;

      console.log(`📊 Procesando historial ${historialId}, periodo: ${periodo}`);
      console.log(`📊 Datos POAI disponibles:`, {
        hasProgramacionFinanciera: !!datosPoai?.programacion_financiera,
        hasProgramacionFisica: !!datosPoai?.programacion_fisica,
        hasBancoProyectos: !!datosPoai?.banco_proyectos,
        programacionFinancieraLength: datosPoai?.programacion_financiera?.length || 0,
        programacionFisicaLength: datosPoai?.programacion_fisica?.length || 0,
        bancoProyectosLength: datosPoai?.banco_proyectos?.length || 0
      });

      // Crear datos del reporte manualmente
      const data: any[] = [];
      let rowNumber = 1;

      // Procesar programación financiera
      if (datosPoai?.programacion_financiera && datosPoai.programacion_financiera.length > 0) {
        console.log(`📊 Procesando ${datosPoai.programacion_financiera.length} elementos de programación financiera`);
        for (const pf of datosPoai.programacion_financiera) {
          console.log(`📊 Procesando meta_id: ${pf.meta_id}`);

          // Obtener meta de producto con todas sus relaciones
          const { data: metaData, error: metaError } = await this.supabaseService.clientAdmin
            .from('meta_producto')
            .select(`
              id,
              nombre,
              meta_numerica,
              unidad_medida,
              unidad_medida_indicador_producto,
              nombre_indicador,
              codigo_programa,
              codigo_producto,
              codigo_sector,
              orientacion,
              area:area(nombre),
              ods:ods(nombre),
              caracterizacion_mga:caracterizacion_mga(
                sector,
                programa,
                producto,
                descripcion_producto,
                unidad_medida_producto,
                indicador_producto,
                unidad_medida_indicador_producto
              )
            `)
            .eq('id', pf.meta_id)
            .single();

          if (metaError) {
            console.error(`❌ Error obteniendo meta ${pf.meta_id}:`, metaError.message);
            continue;
          }

          if (metaData) {
            console.log(`✅ Meta encontrada: ${metaData.nombre} (ID: ${metaData.id})`);
            // Obtener programación física correspondiente
            const pfis = datosPoai?.programacion_fisica?.find(p => p.meta_id === pf.meta_id);

            // Obtener proyectos relacionados
            const proyectos = datosPoai?.banco_proyectos?.filter(bp => {
              // Aquí deberías verificar la relación proyecto_metas
              return true; // Por ahora incluir todos
            }) || [];

            // Si no hay proyectos, crear una fila con solo la meta
            if (proyectos.length === 0) {
              const rowData = {
                'N° Meta': rowNumber++,
                'Dependencia Líder': (metaData.area as any)?.nombre || '',
                'Eje Plan Municipal de Desarrollo 2024 - 2028': '', // Campo vacío por ahora
                'Cod. Sector MGA': metaData.codigo_sector || '',
                'Cod. Programa MGA': metaData.codigo_programa || '',
                'ODS': (metaData.ods as any)?.nombre || '',
                'Cod. Producto MGA': metaData.codigo_producto || '',
                'Producto PMD': metaData.nombre || '',
                'Indicador Producto MGA': '', // Campo vacío como solicitado
                'Nombre Indicador': metaData.nombre_indicador || '',
                'Codigo BPIN': '',
                'Nombre del Proyecto': '',
                'Unidad de Medida MGA': (metaData.caracterizacion_mga as any)?.unidad_medida_indicador_producto || '',
                'Unidad de Medida': metaData.unidad_medida || '',
                'Meta 2028': metaData.meta_numerica || '',
                'Pr {periodo ejecutado}': periodo === 1 ? pf.periodo_uno || 0 :
                                         periodo === 2 ? pf.periodo_dos || 0 :
                                         periodo === 3 ? pf.periodo_tres || 0 :
                                         periodo === 4 ? pf.periodo_cuatro || 0 : 0,
                'Pr {periodo seleccionado}': periodo === 1 ? pfis?.periodo_uno || 0 :
                                            periodo === 2 ? pfis?.periodo_dos || 0 :
                                            periodo === 3 ? pfis?.periodo_tres || 0 :
                                            periodo === 4 ? pfis?.periodo_cuatro || 0 : 0,
                'Total {periodo}': periodo === 1 ? pf.periodo_uno || 0 :
                                   periodo === 2 ? pf.periodo_dos || 0 :
                                   periodo === 3 ? pf.periodo_tres || 0 :
                                   periodo === 4 ? pf.periodo_cuatro || 0 : 0
              };

              data.push(rowData);
            } else {
              // Crear fila por cada proyecto
              for (const proyecto of proyectos) {
                const rowData = {
                  'N° Meta': rowNumber++,
                  'Dependencia Líder': (metaData.area as any)?.nombre || '',
                  'Eje Plan Municipal de Desarrollo 2024 - 2028': '', // Campo vacío por ahora
                  'Cod. Sector MGA': metaData.codigo_sector || '',
                  'Cod. Programa MGA': metaData.codigo_programa || '',
                  'ODS': (metaData.ods as any)?.nombre || '',
                  'Cod. Producto MGA': metaData.codigo_producto || '',
                  'Producto PMD': metaData.nombre || '',
                  'Indicador Producto MGA': '', // Campo vacío como solicitado
                  'Nombre Indicador': metaData.nombre_indicador || '',
                  'Codigo BPIN': proyecto.codigo_bpin || '',
                  'Nombre del Proyecto': proyecto.nombre || '',
                  'Unidad de Medida MGA': (metaData.caracterizacion_mga as any)?.unidad_medida_indicador_producto || '',
                  'Unidad de Medida': metaData.unidad_medida || '',
                  'Meta 2028': metaData.meta_numerica || '',
                  'Pr {periodo ejecutado}': periodo === 1 ? pf.periodo_uno || 0 :
                                           periodo === 2 ? pf.periodo_dos || 0 :
                                           periodo === 3 ? pf.periodo_tres || 0 :
                                           periodo === 4 ? pf.periodo_cuatro || 0 : 0,
                  'Pr {periodo seleccionado}': periodo === 1 ? pfis?.periodo_uno || 0 :
                                              periodo === 2 ? pfis?.periodo_dos || 0 :
                                              periodo === 3 ? pfis?.periodo_tres || 0 :
                                              periodo === 4 ? pfis?.periodo_cuatro || 0 : 0,
                  'Total {periodo}': periodo === 1 ? pf.periodo_uno || 0 :
                                     periodo === 2 ? pf.periodo_dos || 0 :
                                     periodo === 3 ? pf.periodo_tres || 0 :
                                     periodo === 4 ? pf.periodo_cuatro || 0 : 0
                };

                data.push(rowData);
              }
            }
          }
        }
      } else {
        console.warn(`⚠️ No hay programación financiera en el historial ${historialId}`);
      }

      console.log(`📊 Datos generados: ${data.length} filas`);
      if (data.length > 0) {
        console.log(`📊 Primera fila de ejemplo:`, data[0]);
      }

      // Crear Excel con los nuevos headers
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte POAI');

      const headers = [
        'N° Meta',
        'Dependencia Líder',
        'Eje Plan Municipal de Desarrollo 2024 - 2028',
        'Cod. Sector MGA',
        'Cod. Programa MGA',
        'ODS',
        'Cod. Producto MGA',
        'Producto PMD',
        'Indicador Producto MGA',
        'Nombre Indicador',
        'Codigo BPIN',
        'Nombre del Proyecto',
        'Unidad de Medida MGA',
        'Unidad de Medida',
        'Meta 2028',
        'Pr {periodo ejecutado}',
        'Pr {periodo seleccionado}',
        'Total {periodo}'
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      data.forEach(row => {
        const rowData = headers.map(header => row[header] || '');
        worksheet.addRow(rowData);
      });

      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);

    } catch (error) {
      throw new Error(`Error generando reporte: ${error.message}`);
    }
  }

  // Método para obtener datos de preview
  async getPreviewData(historialId: number) {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('poai_historial_cambios')
        .select(`
          id,
          fecha_cambio,
          datos_poai,
          poai:poai!inner(
            periodo
          ),
          usuario:usuarios!inner(
            nombre,
            apellido
          )
        `)
        .eq('id', historialId)
        .single();

      if (error) {
        throw new Error(`Error obteniendo datos: ${error.message}`);
      }

      return {
        historialId: data.id,
        fechaCambio: data.fecha_cambio,
        periodo: (data.poai as any)?.periodo,
        usuario: `${(data.usuario as any)?.nombre} ${(data.usuario as any)?.apellido}`,
        totalMetas: data.datos_poai?.programacion_financiera?.length || 0,
        totalProyectos: data.datos_poai?.banco_proyectos?.length || 0
      };
    } catch (error) {
      throw new Error(`Error en previsualización: ${error.message}`);
    }
  }


}
