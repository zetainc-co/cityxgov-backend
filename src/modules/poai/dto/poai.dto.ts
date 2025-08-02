// ================================================================
// DTOs PARA EL MÓDULO POAI
// ================================================================

// Request para crear POAI
export interface PoaiRequest {
  año: number;
}

// Request para actualizar POAI
export interface PoaiUpdateRequest {
  año?: number;
}

// Response estándar para POAI
export interface PoaiResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Datos completos del POAI con todas las relaciones
export interface PoaiCompletoData {
  poai: {
    id: number;
    periodo: number;
    created_at: string;
    updated_at: string;
    resumen_ejecutivo: {
      total_presupuesto: number;
      total_asignado: number;
      disponible: number;
      numero_proyectos: number;
      porcentaje_ejecucion: number;
    };
  };
  topes_presupuestales: any[];
  banco_proyectos: any[];
  programacion_financiera: any[];
  programacion_fisica: any[];
  fuentes_financiacion: any[];
}

// Datos para actualización completa del POAI
export interface PoaiUpdateData {
  topes_presupuestales?: any[];
  banco_proyectos?: any[];
  programacion_financiera?: any[];
  programacion_fisica?: any[];
}

// Datos del dashboard del POAI
export interface PoaiDashboardData {
  año: number;
  resumen_ejecutivo: {
    total_presupuesto: number;
    total_asignado: number;
    disponible: number;
    numero_proyectos: number;
    porcentaje_ejecucion: number;
  };
  topes_presupuestales: any[];
  banco_proyectos: any[];
  programacion_financiera: any[];
  programacion_fisica: any[];
}

// Resumen ejecutivo
export interface ResumenEjecutivo {
  total_presupuesto: number;
  total_asignado: number;
  disponible: number;
  numero_proyectos: number;
  porcentaje_ejecucion: number;
}

// Error de validación de tope
export interface TopeValidationError {
  fuente_id: number;
  tope_maximo: number;
  total_asignado: number;
  exceso: number;
}

// ================================================================
// DTOs PARA TRAZABILIDAD Y REPORTES
// ================================================================

// Registro de cambio individual
export interface CambioIndividual {
  id: number;
  tipo_cambio: string;
  modulo_afectado: string;
  registro_id: number;
  descripcion_cambio: string;
  fecha_cambio: string;
  datos_anteriores: any;
  datos_nuevos: any;
}

// Resumen de cambios en una actualización
export interface ResumenCambios {
  fecha_actualizacion: string;
  usuario_id: number;
  periodo: number;
  total_cambios: number;
  cambios_detallados: CambioIndividual[];
}

// Historial completo de un POAI
export interface PoaiHistorial {
  id: number;
  poai_id: number;
  usuario_id: number;
  fecha_cambio: string;
  tipo_cambio: string;
  modulo_afectado: string;
  registro_id: number;
  datos_anteriores: any;
  datos_nuevos: any;
  descripcion_cambio: string;
  resumen_cambios?: ResumenCambios;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  };
}

// Request para actualizar POAI con trazabilidad
export interface PoaiUpdateWithTraceabilityRequest {
  año: number;
  usuario_id: number;
  cambios: {
    topes_presupuestales?: any[];
    banco_proyectos?: any[];
    programacion_financiera?: any[];
    programacion_fisica?: any[];
  };
}

// Response de actualización con trazabilidad
export interface PoaiUpdateWithTraceabilityResponse {
  status: boolean;
  message: string;
  data?: {
    poai_actualizado: any;
    resumen_cambios: ResumenCambios;
    historial_creado: boolean;
  };
  error?: string;
}

// Request para obtener historial
export interface PoaiHistorialRequest {
  año: number;
  tipo_cambio?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
  offset?: number;
}

// Response de historial
export interface PoaiHistorialResponse {
  status: boolean;
  message: string;
  data?: {
    historial: PoaiHistorial[];
    total_registros: number;
    resumen_por_tipo: {
      [key: string]: number;
    };
  };
  error?: string;
}

// Reporte de cambios
export interface ReporteCambios {
  periodo: number;
  fecha_generacion: string;
  resumen_ejecutivo: ResumenEjecutivo;
  cambios_por_modulo: {
    banco_proyectos: number;
    topes_presupuestales: number;
    programacion_financiera: number;
    programacion_fisica: number;
  };
  cambios_detallados: CambioIndividual[];
}
