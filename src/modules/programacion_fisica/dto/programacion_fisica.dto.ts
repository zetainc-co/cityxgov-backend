export interface ProgramacionFisica {
  id: number;
  meta_id: number;
  periodo_2024: number; // INTEGER
  periodo_2025: number; // INTEGER
  periodo_2026: number; // INTEGER
  periodo_2027: number; // INTEGER
  total_cuatrienio: number; // INTEGER
  created_at: string;
  updated_at: string;
}

export interface ProgramacionFisicaRequest {
  meta_id: number;
  periodo_2024: number; // INTEGER
  periodo_2025: number; // INTEGER
  periodo_2026: number; // INTEGER
  periodo_2027: number; // INTEGER
}

export interface ProgramacionFisicaResponse {
  status: boolean;
  message: string;
  data: ProgramacionFisica[] | ProgramacionFisica;
  error?: string | null;
}
