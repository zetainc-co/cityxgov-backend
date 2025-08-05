export interface MetaProducto {
  id: number;
  caracterizacion_mga_id: number;
  area_id: number;
  ods_id: number;
  enfoque_poblacional_id: number;
  linea_base: string;
  instrumento_planeacion: string;
  nombre: string;
  meta_numerica: string;
  orientacion: string;
  enfoque_territorial: string;
  codigo_programa: string;
  codigo_producto: string;
  codigo_sector: string;
  created_at: string;
  updated_at: string;
}

export interface MetaProductoRequest {
  caracterizacion_mga_id: number;
  area_id: number;
  ods_id: number;
  enfoque_poblacional_id: number;
  enfoque_territorial: string;
  linea_base: string;
  instrumento_planeacion: string;
  nombre: string;
  meta_numerica: string;
  orientacion: string;
  meta_resultado_ids: number[];
  codigo_programa: string;
  codigo_producto: string;
  codigo_sector: string;
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
