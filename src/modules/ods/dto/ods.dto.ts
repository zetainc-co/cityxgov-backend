export interface Ods {
  id: number;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export interface OdsRequest {
  nombre: string;
}

export interface OdsResponse {
  status: boolean;
  message: string;
  data?: Ods[];
  error?: string | null;
}
