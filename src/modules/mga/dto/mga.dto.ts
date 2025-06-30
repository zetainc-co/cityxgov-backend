export interface CreateMgaDto {
    sector_codigo: number;
    sector_nombre: string;
    programa_codigo: number;
    programa_nombre: string;
    producto_codigo: number;
    producto_nombre: string;
    indicador_codigo: number;
    indicador_nombre: string;
    unidad_medida: string;
    subprograma_codigo: number;
    subprograma_nombre: string;
}

export interface UpdateMgaDto {
    sector_codigo?: number;
    sector_nombre?: string;
    programa_codigo?: number;
    programa_nombre?: string;
    producto_codigo?: number;
    producto_nombre?: string;
    indicador_codigo?: number;
    indicador_nombre?: string;
    unidad_medida?: string;
    subprograma_codigo?: number;
    subprograma_nombre?: string;
}

export interface Mga {
    id: number;
    sector_codigo: number;
    sector_nombre: string;
    programa_codigo: number;
    programa_nombre: string;
    producto_codigo: number;
    producto_nombre: string;
    indicador_codigo: number;
    indicador_nombre: string;
    unidad_medida: string;
    subprograma_codigo: number;
    subprograma_nombre: string;
    created_at: Date;
    updated_at: Date;
}
