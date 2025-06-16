export interface Programa {
  id: number;
  linea_estrategica_id: number;
  nombre: string;
  descripcion: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramaRequest {
  linea_estrategica_id: number;
  nombre: string;
  descripcion: string;
}

export interface FindAllProgramasResponse {
  status: boolean;
  message: string;
  data: Programa[];
  error?: any;
}

export interface ProgramaResponse {
  status: boolean;
  message: string;
  data?: Programa[];
  error?: any;
}


