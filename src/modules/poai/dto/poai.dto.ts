export interface PoaiVigencia {
  id: number;
  año: number;
  descripcion: string | null;
  usuario_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface PoaiVigenciaRequest {
  año: number;
  descripcion?: string;
}

export interface PoaiVigenciaResponse {
  status: boolean;
  message: string;
  data?: PoaiVigencia | PoaiVigencia[];
  error?: string | null;
}

export interface PoaiData {
  vigencia: PoaiVigencia;
  lineas_estrategicas: any[];
  metas_resultado: any[];
  metas_producto: any[];
  topes_presupuestales: any[];
  banco_proyectos: any[];
  programacion_financiera: any[];
  programacion_fisica: any[];
}

export interface PoaiDataResponse {
  status: boolean;
  message: string;
  data?: PoaiData;
  error?: string | null;
}
