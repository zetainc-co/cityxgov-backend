// Linea estrategica
export interface LineaEstrategica {
    id: number;
    nombre: string;
    descripcion: string | null;
    plan_nacional: string | null;
    plan_departamental: string | null;
    created_at: string;
    updated_at: string;
}

// Crear una linea estrategica
export interface CreateLineaEstrategicaRequest {
    nombre: string;
    descripcion?: string | null;
    plan_nacional: string;
    plan_departamental: string;
}

// Respuesta de la creación de una linea estrategica
export interface LineaEstrategicaResponse {
    status: boolean;
    message: string;
    data?: LineaEstrategica[];
    error?: any;
}

