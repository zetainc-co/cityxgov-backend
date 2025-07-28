export interface CreateMgaDto {
  sector?: string | null;
  programa?: string | null;
  producto?: string | null;
  descripcion_producto?: string | null;
  unidad_medida_producto?: string | null;
  producto_activo?: string | null;
  codigo_indicador?: number | null;
  indicador_producto?: string | null;
  unidad_medida_indicador?: string | null;
  principal?: string | null;
  indicador_producto_activo?: string | null;
}

export interface UpdateMgaDto {
  sector?: string | null;
  programa?: string | null;
  producto?: string | null;
  descripcion_producto?: string | null;
  unidad_medida_producto?: string | null;
  producto_activo?: string | null;
  codigo_indicador?: number | null;
  indicador_producto?: string | null;
  unidad_medida_indicador?: string | null;
  principal?: string | null;
  indicador_producto_activo?: string | null;
}

export interface Mga {
  id: number;
  sector?: string | null;
  programa?: string | null;
  producto?: string | null;
  descripcion_producto?: string | null;
  unidad_medida_producto?: string | null;
  producto_activo?: string | null;
  codigo_indicador?: number | null;
  indicador_producto?: string | null;
  unidad_medida_indicador?: string | null;
  principal?: string | null;
  indicador_producto_activo?: string | null;
  created_at: Date;
  updated_at: Date;
}
