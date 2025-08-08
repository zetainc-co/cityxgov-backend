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

      // Intentar usar la función almacenada primero
      try {
        const { data, error } = await this.supabaseService.clientAdmin.rpc('generar_reporte_poai_simple_excel', {
          p_historial_id: historialId
        });

        console.log(`📊 Resultado de RPC:`, { data: data?.length || 0, error: error?.message });

        if (error) {
          console.error(`❌ Error en RPC:`, error);
          throw new Error(`Error en consulta: ${error.message}`);
        }

        if (!data || data.length === 0) {
          console.warn(`⚠️ No se encontraron datos para el historial ${historialId}`);
        } else {
          console.log(`✅ Datos obtenidos: ${data.length} filas`);
        }

        // Crear el Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte POAI');

        // Definir headers manualmente para asegurar el orden
        const headers = [
          'N° Meta',
          'Meta de Producto',
          'Dependencia Responsable',
          'Código del Producto',
          'Eje PMD',
          'Programa PMD',
          'BPIN Proyecto',
          'Proyecto',
          'Pr. Vigencia 2024',
          'Orientación de la Meta',
          'Indicador de Producto',
          'Actividad',
          'Evidencia/Entregable',
          'Recursos Financieros',
          'Recursos Físicos',
          'Recursos Humanos',
          'Recursos Tecnológicos',
          'Fecha de Inicio'
        ];

        // Agregar headers con formato
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Agregar datos
        data.forEach(row => {
          const rowData = headers.map(header => row[header] || '');
          worksheet.addRow(rowData);
        });

        // Ajustar ancho de columnas
        worksheet.columns.forEach(column => {
          column.width = 15;
        });

        // Convertir a buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);

      } catch (rpcError) {
        console.warn(`⚠️ Error con función RPC, usando método directo:`, rpcError.message);
        // Si falla la función RPC, usar el método directo
        return await this.generarReportePoaiDirecto(historialId);
      }

    } catch (error) {
      throw new Error(`Error generando reporte: ${error.message}`);
    }
  }

  // Versión alternativa usando consulta directa (sin función almacenada)
  async generarReportePoaiDirecto(historialId: number): Promise<Buffer> {
    try {
      const query = `
        SELECT
          ROW_NUMBER() OVER (ORDER BY mp.id) as "N° Meta",
          mp.nombre as "Meta de Producto",
          a.nombre as "Dependencia Responsable",
          mp.codigo_producto as "Código del Producto",
          '' as "Eje PMD",
          mp.codigo_programa as "Programa PMD",
          COALESCE(bp_elem->>'codigo_bpin', '') as "BPIN Proyecto",
          COALESCE(bp_elem->>'nombre', '') as "Proyecto",
          '' as "Pr. Vigencia 2024",
          mp.orientacion as "Orientación de la Meta",
          '' as "Indicador de Producto",
          '' as "Actividad",
          '' as "Evidencia/Entregable",
          CASE
            WHEN p.periodo = 1 THEN COALESCE((pf_elem->>'periodo_uno')::integer, 0)
            WHEN p.periodo = 2 THEN COALESCE((pf_elem->>'periodo_dos')::integer, 0)
            WHEN p.periodo = 3 THEN COALESCE((pf_elem->>'periodo_tres')::integer, 0)
            WHEN p.periodo = 4 THEN COALESCE((pf_elem->>'periodo_cuatro')::integer, 0)
            ELSE 0
          END as "Recursos Financieros",
          CASE
            WHEN p.periodo = 1 THEN COALESCE((pfis_elem->>'periodo_uno')::integer, 0)
            WHEN p.periodo = 2 THEN COALESCE((pfis_elem->>'periodo_dos')::integer, 0)
            WHEN p.periodo = 3 THEN COALESCE((pfis_elem->>'periodo_tres')::integer, 0)
            WHEN p.periodo = 4 THEN COALESCE((pfis_elem->>'periodo_cuatro')::integer, 0)
            ELSE 0
          END as "Recursos Físicos",
          '' as "Recursos Humanos",
          '' as "Recursos Tecnológicos",
          '' as "Fecha de Inicio"
        FROM poai_historial_cambios phc
        INNER JOIN poai p ON phc.poai_id = p.id
        CROSS JOIN jsonb_array_elements(phc.datos_poai->'programacion_financiera') pf_elem
        INNER JOIN meta_producto mp ON mp.id = (pf_elem->>'meta_id')::integer
        INNER JOIN area a ON mp.area_id = a.id
        LEFT JOIN jsonb_array_elements(phc.datos_poai->'programacion_fisica') pfis_elem
            ON (pfis_elem->>'meta_id')::integer = mp.id
        LEFT JOIN jsonb_array_elements(phc.datos_poai->'banco_proyectos') bp_elem
            ON EXISTS (
                SELECT 1 FROM proyecto_metas pm
                WHERE pm.proyecto_id = (bp_elem->>'id')::integer
                AND pm.meta_producto_id = mp.id
            )
        WHERE phc.id = $1
        ORDER BY mp.id
      `;

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

      // Crear datos del reporte manualmente
      const data: any[] = [];
      let rowNumber = 1;

      // Procesar programación financiera
      if (datosPoai?.programacion_financiera) {
        for (const pf of datosPoai.programacion_financiera) {
          // Obtener meta de producto
          const { data: metaData } = await this.supabaseService.clientAdmin
            .from('meta_producto')
            .select(`
              id,
              nombre,
              codigo_producto,
              codigo_programa,
              orientacion,
              area:area(nombre)
            `)
            .eq('id', pf.meta_id)
            .single();

                              if (metaData) {
            // Obtener programación física correspondiente
            const pfis = datosPoai?.programacion_fisica?.find(p => p.meta_id === pf.meta_id);

            // Obtener proyectos relacionados
            const proyectos = datosPoai?.banco_proyectos?.filter(bp => {
              // Aquí deberías verificar la relación proyecto_metas
              return true; // Por ahora incluir todos
            }) || [];

            for (const proyecto of proyectos) {
              const rowData = {
                'N° Meta': rowNumber++,
                'Meta de Producto': metaData.nombre || '',
                'Dependencia Responsable': (metaData.area as any)?.nombre || '',
                'Código del Producto': metaData.codigo_producto || '',
                'Eje PMD': '',
                'Programa PMD': metaData.codigo_programa || '',
                'BPIN Proyecto': proyecto.codigo_bpin || '',
                'Proyecto': proyecto.nombre || '',
                'Pr. Vigencia 2024': '',
                'Orientación de la Meta': metaData.orientacion || '',
                'Indicador de Producto': '',
                'Actividad': '',
                'Evidencia/Entregable': '',
                'Recursos Financieros': periodo === 1 ? pf.periodo_uno || 0 :
                                      periodo === 2 ? pf.periodo_dos || 0 :
                                      periodo === 3 ? pf.periodo_tres || 0 :
                                      periodo === 4 ? pf.periodo_cuatro || 0 : 0,
                'Recursos Físicos': periodo === 1 ? pfis?.periodo_uno || 0 :
                                   periodo === 2 ? pfis?.periodo_dos || 0 :
                                   periodo === 3 ? pfis?.periodo_tres || 0 :
                                   periodo === 4 ? pfis?.periodo_cuatro || 0 : 0,
                'Recursos Humanos': '',
                'Recursos Tecnológicos': '',
                'Fecha de Inicio': ''
              };

                            data.push(rowData);
            }
          }
        }
      }

      console.log(`📊 Datos generados: ${data.length} filas`);

      // Crear Excel (mismo código que arriba)
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte POAI');

      const headers = [
        'N° Meta', 'Meta de Producto', 'Dependencia Responsable',
        'Código del Producto', 'Eje PMD', 'Programa PMD',
        'BPIN Proyecto', 'Proyecto', 'Pr. Vigencia 2024',
        'Orientación de la Meta', 'Indicador de Producto', 'Actividad',
        'Evidencia/Entregable', 'Recursos Financieros', 'Recursos Físicos',
        'Recursos Humanos', 'Recursos Tecnológicos', 'Fecha de Inicio'
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
