export interface ProgramacionFisica {
  id: number;
  meta_id: number;
  periodo_uno: number;
  periodo_dos: number;
  periodo_tres: number;
  periodo_cuatro: number;
  total_cuatrienio: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramacionFisicaRequest {
  meta_id: number;
  periodo_uno: number;
  periodo_dos: number;
  periodo_tres: number;
  periodo_cuatro: number;
}

export interface ProgramacionFisicaResponse {
  status: boolean;
  message: string;
  data: ProgramacionFisica[] | ProgramacionFisica;
  error?: string | null;
}
