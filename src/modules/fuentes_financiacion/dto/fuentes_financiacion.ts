export interface FuentesFinanciacion {
  id: number;
  nombre: string;
  descripcion: string;
  created_at: string;
  updated_at: string;
}

export interface FuentesFinanciacionRequest {
  nombre: string;
  descripcion: string;
}

export interface FuentesFinanciacionResponse {
  status: boolean;
  message: string;
  data: FuentesFinanciacion[];
  error?: string | null;
}