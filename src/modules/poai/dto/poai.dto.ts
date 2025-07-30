// DTOs para POAI
export interface Poai {
  id: number;
  año: number;
  entidad_territorial_id: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface LineaEstrategica {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface EntidadTerritorial {
  id: number;
  nombre: string;
  codigo: string;
}

export interface UsuarioCreador {
  id: number;
  nombre: string;
  apellido: string;
  identificacion: string;
}

export interface PoaiCompleto {
  id: number;
  año: number;
  entidad_territorial_id: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  entidad_territorial: EntidadTerritorial;
  usuario_creador: UsuarioCreador | null;
  lineas_estrategicas: LineaEstrategica[];
  banco_proyectos: any[];
  topes_presupuestales: any[];
  programacion_financiera: any[];
  programacion_fisica: any[];
}

// DTOs para requests
export interface PoaiRequest {
  año: number;
  entidad_territorial_id: number;
}

export interface PoaiUpdateRequest {
  año?: number;
  entidad_territorial_id?: number;
}

// DTOs para responses
export interface PoaiResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface PoaiCompletoData {
  poai: PoaiCompleto;
  topes_presupuestales: any[];
  banco_proyectos: any[];
  programacion_financiera: any[];
  programacion_fisica: any[];
  lineas_estrategicas: any[];
  metas_resultado: any[];
  metas_producto: any[];
}
