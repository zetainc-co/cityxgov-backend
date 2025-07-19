export interface ProgramacionFinanciera {
  id: number;
  fuente_id: number;
  meta_id: number;
  periodo_2024: number;
  periodo_2025: number;
  periodo_2026: number;
  periodo_2027: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramacionFinancieraRequest {
  fuente_id: number;
  meta_id: number;
  periodo_2024: number;
  periodo_2025: number;
  periodo_2026: number;
  periodo_2027: number;
}

export interface ProgramacionFinancieraResponse {
  status: boolean;
  message: string;
  data: ProgramacionFinanciera[] | ProgramacionFinanciera;
  error?: string | null;
}
