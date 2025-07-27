export interface LineaEstrategica {
  id: number;
  nombre: string;
  descripcion: string | null;
  plan_nacional: string | null;
  plan_departamental: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineaEstrategicaRequest {
  nombre: string;
  descripcion?: string | null;
  plan_nacional: string;
  plan_departamental: string;
}

export interface LineaEstrategicaResponse {
  status: boolean;
  message: string;
  data?: LineaEstrategica[];
  error?: any;
}
