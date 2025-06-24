export interface MetaProducto {
    id: number;
    caracterizacion_mga_id: number;
    area_id: number;
    ods_id: number;
    enfoque_poblacional_id: number;
    codigo: string;
    linea_base: string;
    instrumento_planeacion: string;
    nombre: string;
    valor: string;
    orientacion: string;
    sector: string;
    total_cuatrienio: string;
    created_at: string;
    updated_at: string;
}

export interface MetaProductoRequest {
    caracterizacion_mga_id: number;
    area_id: number;
    ods_id: number;
    enfoque_poblacional_id: number;
    codigo: string;
    linea_base: string;
    instrumento_planeacion: string;
    nombre: string;
    valor: string;
    orientacion: string;
    sector: string;
    total_cuatrienio: string;
    meta_resultado_ids: number[]; // Para la relación muchos a muchos
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
    mga?: any; // Datos de MGA relacionados
    area?: any; // Datos del área
    ods?: any; // Datos de ODS
    enfoque_poblacional?: any; // Datos de enfoque poblacional
    meta_resultados?: any[]; // Array de meta_resultados relacionados
} 