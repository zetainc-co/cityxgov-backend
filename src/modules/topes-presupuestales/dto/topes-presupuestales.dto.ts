export interface TopesPresupuestales {
  id: number;
  fuente_id: number;
  año: number;
  tope_maximo: number;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopesPresupuestalesRequest {
  fuente_id: number;
  año: number;
  tope_maximo: number;
  descripcion?: string;
}

export interface TopesPresupuestalesResponse {
  status: boolean;
  message: string;
  data?: TopesPresupuestales | TopesPresupuestales[];
  error?: string;
}

// DTO para topes presupuestales con sus relaciones
export interface TopesPresupuestalesWithRelations extends TopesPresupuestales {
  fuentes_financiacion?: any;
}
