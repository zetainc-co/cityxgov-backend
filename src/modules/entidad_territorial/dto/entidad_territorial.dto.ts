// DTOs para Entidad Territorial
export interface EntidadTerritorial {
    id: number;
    nombre_entidad: string;
    nombre_representante_legal: string;
    nit: string;
    nombre_municipio: string;
    departamento: string;
    region?: string;
    categoria_municipal: string;
    poblacion: number;
    descripcion: string;
    // Ubicación Google Maps
    latitud?: number;
    longitud?: number;
    direccion_completa?: string;

    // Archivos (URLs de Supabase Storage)
    logo_municipio?: string;
    imagenes?: string[]; // Array de URLs
    mapa_municipio?: string;

    // Organigrama (estructura JSON)
    organigrama?: any; // JSON object

    created_at: string;
    updated_at: string;
}

export interface EntidadTerritorialRequest {
    nombre_entidad: string;
    nombre_representante_legal: string;
    nit: string;
    nombre_municipio: string;
    departamento: string;
    region?: string;
    categoria_municipal: string;
    poblacion: number;
    descripcion: string;

    // Ubicación Google Maps
    latitud?: number;
    longitud?: number;
    direccion_completa?: string;

    // Archivos (URLs de Supabase Storage)
    logo_municipio?: string;
    imagenes?: string[]; // Array de URLs
    mapa_municipio?: string;

    // Organigrama (estructura JSON)
    organigrama?: any; // JSON object
}

export interface EntidadTerritorialResponse {
    status: boolean;
    message: string;
    data?: EntidadTerritorial | EntidadTerritorial[];
    error?: any;
}


// DTOs para manejo de archivos multimedia
export interface UpdateArchivosRequest {
    logo_municipio?: string;
    imagenes?: string[];
    mapa_municipio?: string;
}

export interface UpdateUbicacionRequest {
    latitud?: number;
    longitud?: number;
    direccion_completa?: string;
}

export interface OrganigramaResponse {
    status: boolean;
    message: string;
    data?: {
        id: number;
        nombre_entidad: string;
        organigrama: any;
    };
    error?: any;
}


