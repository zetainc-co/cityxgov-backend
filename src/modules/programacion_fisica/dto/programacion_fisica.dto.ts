export interface ProgramacionFisica {
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

export interface ProgramacionFisicaRequest {
  fuente_id: number;
  meta_id: number;
  periodo_2024: number;
  periodo_2025: number;
  periodo_2026: number;
  periodo_2027: number;
}

export interface ProgramacionFisicaResponse {
  status: boolean;
  message: string;
  data: ProgramacionFisica[] | ProgramacionFisica;
  error?: string | null;
}
