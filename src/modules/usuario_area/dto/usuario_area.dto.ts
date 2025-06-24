// export interface UsuarioArea {
//     id: number;
//     usuario_id: number;
//     area_id: number;
//     rol_id: number;
//     created_at: string;
//     updated_at: string;
// }

// export interface UsuarioAreaRequest {
//     usuarioArea: {
//         usuario_id: number;
//         area_id: number;
//         rol_id: number;
//     };
// }

// export interface UpdateUsuarioAreaRequest extends UsuarioAreaRequest {}

// export interface Usuario {
//     id: number;
//     identificacion: string;
//     nombre: string;
//     apellido: string;
//     correo: string;
//     telefono: string;
//     avatar: string;
//     activo: boolean;
// }

// export interface Area {
//     id: number;
//     nombre: string;
//     descripcion: string;
// }

// export interface Rol {
//     id: number;
//     nombre: string;
//     descripcion: string;
// }

// export interface UsuarioAreaExpanded {
//     id: number;
//     usuario_id: number;
//     area_id: number;
//     rol_id: number;
//     usuario: Usuario | null;
//     area: Area | null;
//     rol: Rol | null;
//     created_at: string;
//     updated_at: string;
// }

// export interface AsignacionExpanded {
//     id: number;
//     area: Area | null;
//     rol: Rol | null;
//     created_at: string;
//     updated_at: string;
// }

// export interface UsuarioConAsignaciones {
//     usuario: Usuario;
//     asignaciones: AsignacionExpanded[];
// }

// export interface UsuarioAreaResponse {
//     status: number;
//     message: string;
//     data?: UsuarioConAsignaciones[];
//     error?: any;
// }

// export class CreateUsuarioAreaDto {
//     usuarioArea: UsuarioAreaCreateData;
// }

// export class UsuarioAreaCreateData {
//     usuario_id: number;
//     area_id: number;
//     rol_id: number;
// }

// export interface SimpleUsuarioAreaResponse {
//     id: number;
//     usuario_nombre: string;
//     area_nombre: string;
//     rol_nombre: string;
//     created_at: string;
// }

// export interface UsuarioAreaWithRelations {
//     id: number;
//     usuario_id: number;
//     area_id: number;
//     rol_id: number;
//     created_at: string;
//     updated_at: string;
//     usuarios: Usuario;
//     area: Area;
//     rol: Rol;
// }

// export class UpdateUsuarioAreaDto {
//     usuarioArea: UsuarioAreaUpdateData;
// }

// export class UsuarioAreaUpdateData {
//     area_id: number;
//     rol_id: number;
// }
