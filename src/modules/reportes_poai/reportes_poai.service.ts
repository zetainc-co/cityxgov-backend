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

      // Mapear período a año
      const mapeoPeriodos = {
        1: 2024,
        2: 2025,
        3: 2026,
        4: 2027
      };
      const año = mapeoPeriodos[periodo] || 'N/A';

      console.log(`📊 Procesando historial ${historialId}, periodo: ${periodo}, año: ${año}`);
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

          // Obtener meta de producto con todas sus relaciones incluyendo línea estratégica
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

                    // Obtener línea estratégica asociada a la meta de producto
          let lineaEstrategica = '';
          if (metaData) {
            try {
              // Buscar la línea estratégica a través de la relación meta_resultado_producto
              const { data: lineaData } = await this.supabaseService.clientAdmin
                .from('metas_resultado_producto')
                .select(`
                  meta_resultado_id
                `)
                .eq('meta_producto_id', metaData.id)
                .limit(1)
                .maybeSingle();

              if (lineaData?.meta_resultado_id) {
                const { data: metaResultadoData } = await this.supabaseService.clientAdmin
                  .from('meta_resultado')
                  .select(`
                    linea_estrategica:linea_estrategica(nombre)
                  `)
                  .eq('id', lineaData.meta_resultado_id)
                  .maybeSingle();

                if (metaResultadoData?.linea_estrategica) {
                  lineaEstrategica = (metaResultadoData.linea_estrategica as any)?.nombre || '';
                }
              }
            } catch (error) {
              console.log(`ℹ️ No se pudo obtener línea estratégica para meta ${metaData.id}`);
            }
          }

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
                'Eje Plan Municipal de Desarrollo 2024 - 2028': lineaEstrategica || '',
                'Cod. Sector MGA': metaData.codigo_sector || '',
                'Cod. Programa MGA': metaData.codigo_programa || '',
                'ODS': (metaData.ods as any)?.nombre || '',
                'Cod. Producto MGA': metaData.codigo_producto || '',
                'Producto PMD': metaData.nombre || '',
                'Indicador Producto MGA': (metaData.caracterizacion_mga as any)?.indicador_producto || '',
                'Nombre Indicador': metaData.nombre_indicador || '',
                'Codigo BPIN': '',
                'Nombre del Proyecto': '',
                'Unidad de Medida MGA': (metaData.caracterizacion_mga as any)?.unidad_medida_indicador_producto || '',
                'Unidad de Medida': metaData.unidad_medida || '',
                'Meta 2028': metaData.meta_numerica || '',
                [`Pr ${año}`]: periodo === 1 ? pf.periodo_uno || 0 :
                                      periodo === 2 ? pf.periodo_dos || 0 :
                                      periodo === 3 ? pf.periodo_tres || 0 :
                                      periodo === 4 ? pf.periodo_cuatro || 0 : 0,
                [`Total ${año}`]: periodo === 1 ? pf.periodo_uno || 0 :
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
                  'Eje Plan Municipal de Desarrollo 2024 - 2028': lineaEstrategica || '',
                  'Cod. Sector MGA': metaData.codigo_sector || '',
                  'Cod. Programa MGA': metaData.codigo_programa || '',
                  'ODS': (metaData.ods as any)?.nombre || '',
                  'Cod. Producto MGA': metaData.codigo_producto || '',
                  'Producto PMD': metaData.nombre || '',
                  'Indicador Producto MGA': (metaData.caracterizacion_mga as any)?.indicador_producto || '',
                  'Nombre Indicador': metaData.nombre_indicador || '',
                  'Codigo BPIN': proyecto.codigo_bpin || '',
                  'Nombre del Proyecto': proyecto.nombre || '',
                  'Unidad de Medida MGA': (metaData.caracterizacion_mga as any)?.unidad_medida_indicador_producto || '',
                  'Unidad de Medida': metaData.unidad_medida || '',
                  'Meta 2028': metaData.meta_numerica || '',
                  [`Pr ${año}`]: periodo === 1 ? pf.periodo_uno || 0 :
                                 periodo === 2 ? pf.periodo_dos || 0 :
                                 periodo === 3 ? pf.periodo_tres || 0 :
                                 periodo === 4 ? pf.periodo_cuatro || 0 : 0,
                  [`Total ${año}`]: periodo === 1 ? pf.periodo_uno || 0 :
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

      // Crear headers simples (solo un nivel)
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
        `Pr ${año}`,
        `Total ${año}`
      ];

      // Agregar título principal en la primera fila
      const tituloPrincipal = `Reporte de Plan Operativo Manual de inversiones periodo ${año}`;
      const tituloRow = worksheet.addRow([tituloPrincipal]);

      // Formatear título principal - fondo blanco y letra negra
      tituloRow.font = { bold: true, size: 18, color: { argb: 'FF000000' } }; // Letra negra
      tituloRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' } // Fondo blanco
      };

      // Centrar el título
      tituloRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Aplicar bordes negros al título principal
      tituloRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Combinar solo hasta donde hay datos reales
      const lastDataColumn = String.fromCharCode(65 + headers.length - 1); // 65 = 'A', calcular la última columna
      worksheet.mergeCells(`A1:${lastDataColumn}2`);

      // Agregar headers en la fila 3 (después del título)
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2CC' } // Amarillo claro para los headers
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Aplicar bordes negros a los headers y limitar el color solo hasta donde hay datos
      const totalColumns = headers.length;
      headerRow.eachCell((cell, colNumber) => {
        // Solo aplicar color amarillo hasta donde hay datos
        if (colNumber <= totalColumns) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2CC' } // Amarillo claro para los headers
          };
        }

        // Aplicar bordes negros a todos los headers
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Agregar datos con formato optimizado para texto largo
      data.forEach(row => {
        const rowData = headers.map(header => row[header] || '');
        const dataRow = worksheet.addRow(rowData);

        // Configurar cada celda para mejor legibilidad
        dataRow.eachCell((cell, colNumber) => {
          // Habilitar wrap text para todas las celdas
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true
          };

          // Configurar altura de fila para que se ajuste al contenido
          dataRow.height = 30; // Altura base más generosa para mejor legibilidad

          // Aplicar bordes negros a todas las celdas de datos
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });

        // Configurar altura de fila automática basada en el contenido
        let maxLines = 1;
        headers.forEach((header, index) => {
          const cellValue = row[header] || '';
          if (cellValue && typeof cellValue === 'string') {
            const estimatedLines = Math.ceil(cellValue.length / 50); // Estimación de líneas
            maxLines = Math.max(maxLines, estimatedLines);
          }
        });

        // Ajustar altura de fila basada en el contenido
        dataRow.height = Math.max(30, maxLines * 15); // Mínimo 30px, ajuste por contenido
      });

      // Configurar ancho de columnas con más espacio para mejor legibilidad
      worksheet.columns.forEach((column, index) => {
        if (index === 0) column.width = 10;       // N° Meta
        else if (index === 1) column.width = 30;   // Dependencia Líder
        else if (index === 2) column.width = 50;   // Eje Plan Municipal (mucho más ancho para texto largo)
        else if (index === 3) column.width = 25;   // Cod. Sector MGA
        else if (index === 4) column.width = 35;   // Cod. Programa MGA (más ancho para descripciones)
        else if (index === 5) column.width = 25;   // ODS
        else if (index === 6) column.width = 30;   // Cod. Producto MGA
        else if (index === 7) column.width = 45;   // Producto PMD (mucho más ancho para nombres largos)
        else if (index === 8) column.width = 35;   // Indicador Producto MGA
        else if (index === 9) column.width = 40;   // Nombre Indicador (más ancho para descripciones largas)
        else if (index === 10) column.width = 25;  // Codigo BPIN
        else if (index === 11) column.width = 40;  // Nombre del Proyecto (más ancho para nombres largos)
        else if (index === 12) column.width = 30;  // Unidad de Medida MGA
        else if (index === 13) column.width = 25;  // Unidad de Medida
        else if (index === 14) column.width = 20;  // Meta 2028
        else if (index === 15) column.width = 25;  // Pr 2025
        else if (index === 16) column.width = 25;  // Total 2025
        else column.width = 25;
      });

      // Configurar altura de filas para mejor espaciado
      worksheet.getRow(1).height = 30;  // Título principal
      worksheet.getRow(2).height = 30;  // Título principal (continuación)
      worksheet.getRow(3).height = 25;  // Headers

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
