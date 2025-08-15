export interface ListarSnapshotsDto {
    fechaDesde?: string;
    fechaHasta?: string;
}

export interface ObtenerSnapshotDto {
    id: number;
}

export interface GenerarExcelSnapshotDto {
    id: number;
}

export interface CapturarSnapshotDto {
    usuarioId?: number | null;
    triggeredTable: string;
    accion: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface SnapshotUsuarioDto {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    identificacion: string;
}

export interface PlanIndicativoHistorialDto {
    id: number;
    usuario_id: number;
    triggered_table: string;
    accion: 'INSERT' | 'UPDATE' | 'DELETE';
    fecha_cambio: string;
    snapshot: any;
    usuario: SnapshotUsuarioDto;
}

export interface ListarSnapshotsResponseDto {
    status: boolean;
    data: PlanIndicativoHistorialDto[];
}

export interface ObtenerSnapshotResponseDto {
    status: boolean;
    data: PlanIndicativoHistorialDto;
}

export interface CapturarSnapshotResponseDto {
    status: boolean;
    error?: string;
}

export interface HeadersInfoDto {
    lastCol: string;
    finStart?: string;
    finEnd?: string;
    totalCol?: string;
}

export interface FuenteFinanciacionDto {
    id: number;
    nombre: string;
}

export interface EnfoquePoblacionalDto {
    id: number;
    nombre: string;
}

export interface AreaDto {
    id: number;
    nombre: string;
}

export interface MetaResultadoDto {
    id: number;
    nombre: string;
    linea_base: string;
    año_linea_base: string;
    meta_cuatrienio: string;
    fuente: string;
    linea_estrategica_id: number;
}

export interface LineaDto {
    id: number;
    nombre: string;
    plan_nacional: string;
    plan_departamental: string;
}

export interface CaracterizacionMgaDto {
    id: number;
    codigo_indicador: number;
    codigo_programa: string;
    codigo_producto: string;
    sector: string;
}

export interface OdsDto {
    id: number;
    nombre: string;
}

export interface ProgramaDto {
    id: number;
    nombre: string;
}
