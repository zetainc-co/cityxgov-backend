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

// Interfaz para crear un nuevo usuario
export interface NuevoUsuario {
    identificacion: number;
    nombre: string;
    apellido: string;
    telefono: string;
    correo: string;
    descripcion?: string;
    avatar?: string;
}

// Interfaz para la respuesta de un usuario
export interface UsuarioResponse {
    status: boolean;
    message: string;
    data: Array<{
        id: number;
        identificacion: number;
        nombre: string;
        apellido: string;
        telefono: string;
        correo: string;
        avatar?: string;
        descripcion?: string;
        activo: boolean;
        created_at: string;
        updated_at: string;
    }>;
}

// Interfaz para actualizar un usuario
export interface ActualizarUsuario {
    identificacion?: number;
    nombre?: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
    descripcion?: string;
    avatar?: string;
}

// Interfaz para actualizar el estado de un usuario
export interface ActualizarEstadoUsuario {
    activo: boolean;
}
