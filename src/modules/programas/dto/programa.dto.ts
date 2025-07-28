export interface Programa {
  id: number;
  linea_estrategica_id: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramaRequest {
  linea_estrategica_id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface ProgramaResponse {
  status: boolean;
  message: string;
  data?: Programa[];
  error?: any;
}
