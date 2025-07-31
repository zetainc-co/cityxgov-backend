export interface ProgramacionFinanciera {
  id: number;
  fuente_id: number;
  meta_id: number;
  periodo_uno: number;
  periodo_dos: number;
  periodo_tres: number;
  periodo_cuatro: number;
  total_cuatrienio: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramacionFinancieraRequest {
  fuente_id: number;
  meta_id: number;
  periodo_uno: number;
  periodo_dos: number;
  periodo_tres: number;
  periodo_cuatro: number;
}

export interface ProgramacionFinancieraResponse {
  status: boolean;
  message: string;
  data: ProgramacionFinanciera[] | ProgramacionFinanciera;
  error?: string | null;
}
