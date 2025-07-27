export interface MetaResultado {
  id: number;
  linea_estrategica_id: number;
  nombre: string;
  indicador: string;
  linea_base: string;
  año_linea_base: number;
  meta_cuatrienio: string;
  fuente: string;
  created_at: string;
  updated_at: string;
}

export interface MetaResultadoRequest {
  linea_estrategica_id: number;
  nombre: string;
  indicador: string;
  linea_base: string;
  año_linea_base: number;
  meta_cuatrienio: string;
  fuente: string;
}

export interface MetaResultadoResponse {
  status: boolean;
  message: string;
  data?: MetaResultado[];
  error?: any;
}
