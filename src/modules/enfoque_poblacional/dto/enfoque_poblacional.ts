export interface EnfoquePoblacional {
    id: number;
    nombre: string;
    descripcion: string;
    created_at: string;
    updated_at: string;
}

export interface EnfoquePoblacionalRequest {
    nombre: string;
    descripcion: string;
}

export interface EnfoquePoblacionalResponse {
    status: boolean;
    message: string;
    data?: EnfoquePoblacional[];
    error?: string | null;
}