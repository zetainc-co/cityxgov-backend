export interface Area {
    id: number;
    nombre: string;
    descripcion: string | null;
    created_at: string;
    updated_at: string;
}

export interface AreaRequest {
    nombre: string;
    descripcion?: string;
}

export interface AreaResponse {
    status: boolean;
    message: string;
    data?: Area[];
    error?: any;
}
