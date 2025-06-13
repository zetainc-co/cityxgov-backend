export interface Programa {
  id: number;
  linea_estrategica_id: number;
  nombre: string;
  descripcion: string;
  create_at: string;
  update_at: string;
}

export interface CreateProgramaRequest {
  linea_estrategica_id: number;
  nombre: string;
  descripcion: string;
}

export interface FindAllProgramasResponse {
  status: number;
  message: string;
  data: Programa[];
  error?: any;
}

export interface CreateProgramaResponse {
  status: boolean;
  message: string;
  data?: Programa[];
  error?: any;
}


