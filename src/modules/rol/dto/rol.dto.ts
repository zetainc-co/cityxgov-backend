export interface Role {
    id: number;
    nombre: string;
    descripcion: string | null;
    created_at: string;
    updated_at?: string;
}

export interface CreateRoleRequest {
    role: {
        nombre: string;
        descripcion?: string;
    };
}

export interface RoleResponse {
    status: boolean;
    message: string;
    data?: Role[];
    error?: any;
}
