// DTO básico para la tabla usuario_area
export interface UsuarioArea {
    id: number;
    usuario_id: number;
    area_id: number;
    rol_id: number;
    created_at: string;
    updated_at: string;
}

// DTO para crear una nueva asignación
export interface CreateUsuarioAreaRequest {
    usuarioArea: {
        usuario_id: number;
        area_id: number;
        rol_id: number;
    };
}

// DTO para actualizar una asignación (mismo que crear)
export interface UpdateUsuarioAreaRequest extends CreateUsuarioAreaRequest {}

// Interface for the user data
export interface Usuario {
    id: number;
    identificacion: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    avatar: string;
    activo: boolean;
}

// Interface for the area data
export interface Area {
    id: number;
    nombre: string;
    descripcion: string;
}

// Interface for the rol data
export interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
}

// Interface for expanded usuario_area data
export interface UsuarioAreaExpanded {
    id: number;
    usuario_id: number;
    area_id: number;
    rol_id: number;
    usuario: Usuario | null;
    area: Area | null;
    rol: Rol | null;
    created_at: string;
    updated_at: string;
}

// Interface for expanded usuario_area data (assignment data without user info)
export interface AsignacionExpanded {
    id: number;
    area: Area | null;
    rol: Rol | null;
    created_at: string;
    updated_at: string;
}

// Interface for user with their assignments
export interface UsuarioConAsignaciones {
    usuario: Usuario;
    asignaciones: AsignacionExpanded[];
}

// DTO para la respuesta de la API
export interface UsuarioAreaResponse {
    status: number;
    message: string;
    data?: UsuarioConAsignaciones[];
    error?: any;
}

export class CreateUsuarioAreaDto {
    usuarioArea: UsuarioAreaCreateData;
}

export class UsuarioAreaCreateData {
    usuario_id: number;
    area_id: number;
    rol_id: number;
}

// DTO para respuestas simplificadas
export interface SimpleUsuarioAreaResponse {
    id: number;
    usuario_nombre: string;
    area_nombre: string;
    rol_nombre: string;
    created_at: string;
}

// Interface for Supabase response structure
export interface UsuarioAreaWithRelations {
    id: number;
    usuario_id: number;
    area_id: number;
    rol_id: number;
    created_at: string;
    updated_at: string;
    usuarios: Usuario;
    area: Area;
    rol: Rol;
}
