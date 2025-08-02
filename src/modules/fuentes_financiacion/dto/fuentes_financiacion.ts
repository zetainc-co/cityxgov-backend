export interface FuentesFinanciacion {
  id: number;
  nombre: string;
  codigo_fuente: string;
  marco_normativo?: string;
  created_at: string;
  updated_at: string;
}

export interface FuentesFinanciacionRequest {
  nombre: string;
  codigo_fuente: string;
  marco_normativo?: string;
}

export interface FuentesFinanciacionResponse {
  status: boolean;
  message: string;
  data: FuentesFinanciacion[];
  error?: string | null;
}
