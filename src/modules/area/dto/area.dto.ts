import { AreaModulos } from '../../../utils/modules.constants';

export interface Area {
    id: number;
    nombre: string;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    descripcion: string | null;
    modulos: AreaModulos | null; // 👈 Puede ser null o parcial
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
    modulos?: AreaModulos; // 👈 Ahora es opcional
}

export interface AreaResponse {
    status: boolean;
    message: string;
    data?: Area | Area[];
    error?: any;
}

export interface Modulos {
    id: string;
    nombre: string;
    descripcion: string;
    submodulos: string[];
}

export interface ModuloConfig {
    activo: boolean;
    submodulos: string[];
}

export interface ModulosResponse {
    status: boolean;
    message: string;
    data?: Modulos[];
    error?: any;
}
