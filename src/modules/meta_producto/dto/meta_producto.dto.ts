export interface MetaProducto {
  id: number;
  caracterizacion_mga_id: number;
  area_id: number;
  unidad_medida?: string;
  ods_id: number;
  linea_base: number;
  instrumento_planeacion: string;
  nombre: string;
  meta_numerica: string;
  orientacion: string;
  enfoque_territorial: any;
  codigo_programa: string; //MGA
  codigo_producto: string; //MGA
  codigo_sector: string; //MGA
  unidad_medida_indicador_producto: string; //MGA
  nombre_indicador: string;
  created_at: string;
  updated_at: string;
}

export interface MetaProductoRequest {
  caracterizacion_mga_id: number;
  area_id: number;
  ods_id: number;
  enfoque_poblacional_ids?: number[]; // Array de IDs - opcional
  enfoque_territorial: any; // JSONB - obligatorio
  linea_base: number;
  instrumento_planeacion: string;
  nombre: string;
  meta_numerica: string;
  orientacion: string;
  meta_resultado_ids: number[];
  codigo_programa: string;
  codigo_producto: string;
  codigo_sector: string;
  unidad_medida?: string; // Opcional
  unidad_medida_indicador_producto?: string; // Opcional
  nombre_indicador?: string; // Opcional
}

export interface MetaProductoResponse {
  status: boolean;
  message: string;
  data?: MetaProducto[];
  error?: string | null;
}

// DTO para la tabla intermedia meta_resultado_producto
export interface MetaResultadoProducto {
  id: number;
  meta_producto_id: number;
  meta_resultado_id: number;
  created_at: string;
  updated_at: string;
}

// DTO para meta_producto con sus relaciones
export interface MetaProductoWithRelations extends MetaProducto {
  mga?: any;
  area?: any;
  ods?: any;
  enfoque_poblacional?: any;
  meta_resultados?: any[];
}
