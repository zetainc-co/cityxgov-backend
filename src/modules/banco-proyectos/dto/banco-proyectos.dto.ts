export interface BancoProyectos {
  id: number;
  nombre: string;
  codigo_bpim: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface BancoProyectosRequest {
  nombre: string;
  codigo_bpim: string;
  descripcion?: string;
  meta_producto_ids: number[];
}

export interface BancoProyectosResponse {
  status: boolean;
  message: string;
  data?: BancoProyectos | BancoProyectos[];
  error?: string;
}

// DTO para la tabla intermedia proyecto_metas
export interface ProyectoMetas {
  id: number;
  proyecto_id: number;
  meta_producto_id: number;
  created_at: string;
  updated_at: string;
}

export type MetaConMGA = { caracterizacion_mga?: { programa?: string } | { programa?: string }[] };

// DTO para banco de proyectos con sus relaciones
export interface BancoProyectosWithRelations extends BancoProyectos {
  meta_productos?: any[]; // Array de metas de producto relacionadas
  caracterizacion_mga?: any; // Datos de MGA relacionados
}
