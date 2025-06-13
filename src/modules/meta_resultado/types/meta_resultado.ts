export interface MetaResultado {
  id: number;
  linea_estrategica_id: number;
  nombre: string;
  indicador: string;
  linea_base: string;
  año_linea_base: number;
  meta_cuatrienio: string;
  fuente: string;
  create_at: string;
  update_at: string;
}

export interface CreateMetaResultadoRequest {
  linea_estrategica_id: number;
  nombre: string;
  indicador: string;
  linea_base: string;
  año_linea_base: number;
  meta_cuatrienio: string;
  fuente: string;
}

export interface FindAllMetaResultadosResponse {
  status: number;
  message: string;
  data: MetaResultado[];
  error?: any;
}

export interface CreateMetaResultadoResponse {
  status: boolean;
  message: string;
  data?: MetaResultado[];
  error?: any;
}
