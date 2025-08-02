export interface EnfoquePoblacional {
  id: number;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export interface EnfoquePoblacionalRequest {
  nombre: string;
}

export interface EnfoquePoblacionalResponse {
  status: boolean;
  message: string;
  data?: EnfoquePoblacional[];
  error?: string | null;
}
