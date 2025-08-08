export interface ReportePeriodoRequest {
  año: number;
  usuario_id: number;
}

export interface ReportePeriodoResponse {
  status: boolean;
  message: string;
  data?: {
    fecha_reporte: string;
    usuario_reporte: {
      id: number;
      nombre: string;
      apellido: string;
      area: {
        id: number;
        nombre: string;
        responsable: string;
      };
    };
    periodo: number;
    año: number;
    estado_actual: any;
    resumen: {
      total_proyectos: number;
      total_topes: number;
      total_programacion_financiera: number;
      total_programacion_fisica: number;
    };
  };
  error?: string;
}

export interface ReporteHistorialResponse {
  status: boolean;
  message: string;
  data?: {
    historial: any[];
    total_reportes: number;
    periodo: number;
    año: number;
  };
  error?: string;
}

export interface ReporteItem {
  id: number;
  poai_id: number;
  usuario_id: number;
  fecha_cambio: string;
  datos_poai: any;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    identificacion: string;
  };
  poai: {
    id: number;
    periodo: number;
    created_at: string;
    updated_at: string;
  };
}

export interface ReporteByIdResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ReportesListResponse {
  status: boolean;
  message: string;
  data?: {
    reportes: any[];
    total_reportes: number;
  };
  error?: string;
}

// DTO para filtros
export interface ReportesFiltrosRequest {
  fechaEspecifica?: string;
}

// DTOs para reporte de Excel basado en trazabilidad
export interface GenerarReporteExcelRequest {
  historial_id: number;
}

export interface GenerarReporteExcelResponse {
  status: boolean;
  message: string;
  data?: Buffer;
  filename?: string;
  error?: string;
}

// Estructura de datos para el reporte Excel
export interface ReporteExcelRow {
  // Meta Producto
  meta_producto_nombre: string;
  meta_producto_orientacion: string;
  meta_producto_enfoque_territorial: string;
  meta_producto_codigo_programa: string;
  meta_producto_codigo_producto: string;
  meta_producto_codigo_sector: string;

  // Banco de Proyectos
  banco_proyecto_nombre: string;
  banco_proyecto_codigo_bpin: string;
  banco_proyecto_descripcion: string;

  // Programación Financiera
  programacion_financiera_periodo_uno: number;
  programacion_financiera_periodo_dos: number;
  programacion_financiera_periodo_tres: number;
  programacion_financiera_periodo_cuatro: number;

  // Programación Física
  programacion_fisica_periodo_uno: number;
  programacion_fisica_periodo_dos: number;
  programacion_fisica_periodo_tres: number;
  programacion_fisica_periodo_cuatro: number;

  // Información adicional
  area_nombre: string;
  ods_nombre: string;
  enfoque_poblacional_nombre: string;
  caracterizacion_mga_codigo_indicador: string;
}
