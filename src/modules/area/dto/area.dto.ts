export interface Area {
    id: number;
    nombre: string;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    descripcion: string | null;
    responsable: string;
    created_at: string;
    updated_at: string;
}

export interface AreaRequest {
    nombre: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    descripcion?: string;
    responsable: string;
}

export interface AreaResponse {
    status: boolean;
    message: string;
    data?: Area[];
    error?: any;
}
