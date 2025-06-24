export interface Role {
    id: number;
    nombre: string;
    descripcion: string | null;
    created_at: string;
    updated_at: string;
}

export interface RoleRequest {
    nombre: string;
    descripcion?: string | null;
}

export interface RoleResponse {
    status: boolean;
    message: string;
    data?: Role[];
    error?: any;
}
