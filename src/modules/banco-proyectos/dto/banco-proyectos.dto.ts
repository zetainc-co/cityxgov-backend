export interface BancoProyectos {
  id: number;
  codigo_bpin: string;
  nombre: string;
  descripcion: string;
  periodo: number;
  created_at: string;
  updated_at: string;
}

export interface BancoProyectosRequest {
  codigo_bpin: string;
  nombre: string;
  descripcion: string;
  periodo: number;
  meta_producto_ids?: number[];
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
  proyecto_metas?: Array<{
    meta_producto_id: number;
    meta_producto: {
      id: number;
      nombre: string;
      caracterizacion_mga?: Array<{
        programa: string;
      }>;
    };
  }>;
}
