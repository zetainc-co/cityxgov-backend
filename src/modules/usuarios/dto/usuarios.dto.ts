// Interfaz para el usuario en la base de datos
export interface Usuario {
    id: number;
    user_id: string;
    identificacion: number;
    nombre: string;
    apellido: string;
    telefono: string;
    correo: string;
    contrasena: string;
    descripcion?: string;
    avatar?: string;
    activo: boolean;
    token: string;
    created_at: string;
    updated_at: string;
}

// Interfaces para área y rol
export interface Area {
    id: number;
    nombre: string;
    descripcion: string;
}

export interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
}

// Interfaz para asignación de área y rol
export interface UsuarioAsignacion {
    id: number;
    area: Area;
    rol: Rol;
    created_at: string;
    updated_at: string;
}

// Interfaz para usuario con sus asignaciones
export interface UsuarioCompleto {
    id: number;
    identificacion: number;
    nombre: string;
    apellido: string;
    telefono: string;
    correo: string;
    avatar?: string;
    descripcion?: string;
    activo: boolean;
    asignaciones: UsuarioAsignacion[];
    created_at: string;
    updated_at: string;
}

// Interfaz para crear un nuevo usuario (AHORA INCLUYE ÁREA Y ROL REQUERIDOS)
export interface UsuarioRequest {
    identificacion: number;
    nombre: string;
    apellido: string;
    telefono: string;
    correo: string;
    descripcion?: string;
    avatar?: string;
    area_id: number;    // REQUERIDO
    rol_id: number;     // REQUERIDO
}

// Interfaz para actualizar un usuario (PUEDE INCLUIR CAMBIO DE ÁREA Y ROL)
export interface UsuarioUpdateRequest {
    identificacion?: number;
    nombre?: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
    descripcion?: string;
    avatar?: string;
    area_id?: number;   // OPCIONAL en update
    rol_id?: number;    // OPCIONAL en update
}

// Interfaz para la respuesta estándar (siguiendo el patrón de otros servicios)
export interface UsuarioResponse {
    status: boolean;
    message: string;
    data?: UsuarioCompleto | UsuarioCompleto[];
    error?: any;
}

// Interfaz para actualizar el estado de un usuario
export interface ActualizarEstadoUsuario {
    activo: boolean;
}

// Interfaz para cambio de contraseña
export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
}

// INTERFACES LEGACY (para mantener compatibilidad durante la transición)
export interface NuevoUsuario {
    identificacion: number;
    nombre: string;
    apellido: string;
    telefono: string;
    correo: string;
    descripcion?: string;
    avatar?: string;
}

export interface ActualizarUsuario {
    identificacion?: number;
    nombre?: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
    descripcion?: string;
    avatar?: string;
}
