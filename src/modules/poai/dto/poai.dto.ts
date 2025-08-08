export interface PoaiRequest {
  año: number;
}

export interface PoaiResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface PoaiCompletoData {
  poai: any;
  banco_proyectos: any[];
  topes_presupuestales: any[];
  programacion_financiera: any[];
  programacion_fisica: any[];
  fuentes_financiacion: any[];
  resumen_ejecutivo: any;
}
