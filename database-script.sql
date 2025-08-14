-- ================================================================
-- SCRIPT PARA CREAR BASE DE DATOS
-- Sistema de Gestión Estratégica
-- Archivo: database_script.sql
-- Base de datos: Supabase
-- Fecha: 2025-01-21
-- Actualizado: 2025-01-21
-- Autor: Yedixon Ramones
-- Versión: 2.0.0 (Actualizado para coincidir con esquema actual de Supabase)
-- ================================================================

-- ================================================================
-- 1. FUNCIÓN PARA TRIGGER DE UPDATED_AT (Se crea una sola vez)
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================================================
-- 2. TABLAS MAESTRAS
-- ================================================================

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id UUID DEFAULT auth.uid(),
    identificacion VARCHAR UNIQUE,
    nombre VARCHAR,
    apellido VARCHAR,
    descripcion TEXT,
    correo VARCHAR,
    telefono VARCHAR,
    activo BOOLEAN,
    contrasena VARCHAR,
    avatar VARCHAR,
    token VARCHAR,
    cargo VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT usuarios_pkey PRIMARY KEY (id),
    CONSTRAINT profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabla: rol
CREATE TABLE IF NOT EXISTS rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: area
CREATE TABLE IF NOT EXISTS area (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    telefono VARCHAR,
    correo VARCHAR,
    direccion VARCHAR,
    responsable VARCHAR,
    modulos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: ods
CREATE TABLE IF NOT EXISTS ods (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: enfoque_poblacional
CREATE TABLE IF NOT EXISTS enfoque_poblacional (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: fuentes_financiacion
CREATE TABLE IF NOT EXISTS fuentes_financiacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    codigo_fuente VARCHAR,
    marco_normativo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: caracterizacion_mga
CREATE TABLE IF NOT EXISTS caracterizacion_mga (
    id SERIAL PRIMARY KEY,
    sector VARCHAR,
    programa VARCHAR,
    producto VARCHAR,
    descripcion_producto TEXT,
    unidad_medida_producto TEXT,
    producto_activo VARCHAR,
    codigo_indicador INTEGER,
    indicador_producto TEXT,
    unidad_medida_indicador TEXT,
    principal VARCHAR,
    indicador_producto_activo VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: entidad_territorial
CREATE TABLE IF NOT EXISTS entidad_territorial (
    id SERIAL PRIMARY KEY,
    nombre_entidad VARCHAR NOT NULL,
    nombre_representante_legal VARCHAR NOT NULL,
    nit VARCHAR NOT NULL UNIQUE,
    nombre_municipio VARCHAR NOT NULL,
    departamento VARCHAR NOT NULL,
    region VARCHAR,
    categoria_municipal VARCHAR NOT NULL,
    poblacion INTEGER NOT NULL,
    latitud NUMERIC,
    longitud NUMERIC,
    direccion_completa TEXT,
    logo_municipio TEXT,
    imagenes TEXT[],
    mapa_municipio TEXT,
    organigrama JSONB,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: linea_estrategica
CREATE TABLE IF NOT EXISTS linea_estrategica (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    plan_nacional TEXT,
    plan_departamental TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: programa
CREATE TABLE IF NOT EXISTS programa (
    id SERIAL PRIMARY KEY,
    linea_estrategica_id INTEGER NOT NULL,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_programa_linea_estrategica FOREIGN KEY (linea_estrategica_id) REFERENCES linea_estrategica(id)
);

-- Tabla: meta_resultado
CREATE TABLE IF NOT EXISTS meta_resultado (
    id SERIAL PRIMARY KEY,
    linea_estrategica_id INTEGER NOT NULL,
    nombre VARCHAR NOT NULL,
    indicador VARCHAR,
    linea_base VARCHAR,
    año_linea_base INTEGER,
    meta_cuatrienio VARCHAR,
    fuente VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_meta_resultado_linea_estrategica FOREIGN KEY (linea_estrategica_id) REFERENCES linea_estrategica(id)
);

-- Tabla: meta_producto
CREATE TABLE IF NOT EXISTS meta_producto (
    id SERIAL PRIMARY KEY,
    caracterizacion_mga_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    ods_id INTEGER NOT NULL,
    enfoque_poblacional_id INTEGER NOT NULL,
    linea_base VARCHAR,
    instrumento_planeacion VARCHAR,
    nombre VARCHAR NOT NULL,
    meta_numerica VARCHAR,
    orientacion VARCHAR,
    enfoque_territorial VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_meta_producto_caracterizacion_mga FOREIGN KEY (caracterizacion_mga_id) REFERENCES caracterizacion_mga(id),
    CONSTRAINT fk_meta_producto_area FOREIGN KEY (area_id) REFERENCES area(id),
    CONSTRAINT fk_meta_producto_ods FOREIGN KEY (ods_id) REFERENCES ods(id),
    CONSTRAINT fk_meta_producto_enfoque_poblacional FOREIGN KEY (enfoque_poblacional_id) REFERENCES enfoque_poblacional(id)
);

-- Tabla: usuario_area
CREATE TABLE IF NOT EXISTS usuario_area (
    id SERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    area_id INTEGER NOT NULL,
    rol_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_area_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_usuario_area_area FOREIGN KEY (area_id) REFERENCES area(id),
    CONSTRAINT fk_usuario_area_rol FOREIGN KEY (rol_id) REFERENCES rol(id)
);

-- Tabla: banco_proyectos
CREATE TABLE IF NOT EXISTS banco_proyectos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    codigo_bpin VARCHAR NOT NULL UNIQUE,
    descripcion TEXT,
    periodo INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: poai
CREATE TABLE IF NOT EXISTS poai (
    id SERIAL PRIMARY KEY,
    periodo INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: topes_presupuestales
CREATE TABLE IF NOT EXISTS topes_presupuestales (
    id SERIAL PRIMARY KEY,
    fuente_id INTEGER NOT NULL,
    tope_maximo NUMERIC NOT NULL,
    descripcion TEXT,
    periodo INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_topes_presupuestales_fuente FOREIGN KEY (fuente_id) REFERENCES fuentes_financiacion(id)
);

-- Tabla: programacion_financiera
CREATE TABLE IF NOT EXISTS programacion_financiera (
    id SERIAL PRIMARY KEY,
    meta_id INTEGER NOT NULL,
    fuente_id INTEGER,
    periodo_uno INTEGER,
    periodo_dos INTEGER,
    periodo_tres INTEGER,
    periodo_cuatro INTEGER,
    total_cuatrienio INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_programacion_financiera_meta FOREIGN KEY (meta_id) REFERENCES meta_producto(id),
    CONSTRAINT programacion_financiera_fuente_id_fkey FOREIGN KEY (fuente_id) REFERENCES fuentes_financiacion(id)
);

-- Tabla: programacion_fisica
CREATE TABLE IF NOT EXISTS programacion_fisica (
    id SERIAL PRIMARY KEY,
    meta_id INTEGER NOT NULL,
    periodo_uno INTEGER,
    periodo_dos INTEGER,
    periodo_tres INTEGER,
    periodo_cuatro INTEGER,
    total_cuatrienio INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_programacion_fisica_meta FOREIGN KEY (meta_id) REFERENCES meta_producto(id)
);

-- Tabla: proyecto_metas
CREATE TABLE IF NOT EXISTS proyecto_metas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL,
    meta_producto_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_proyecto_metas_proyecto FOREIGN KEY (proyecto_id) REFERENCES banco_proyectos(id),
    CONSTRAINT fk_proyecto_metas_meta FOREIGN KEY (meta_producto_id) REFERENCES meta_producto(id)
);

-- Tabla: metas_resultado_producto
CREATE TABLE IF NOT EXISTS metas_resultado_producto (
    id SERIAL PRIMARY KEY,
    meta_producto_id INTEGER NOT NULL,
    meta_resultado_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_mrp_meta_producto FOREIGN KEY (meta_producto_id) REFERENCES meta_producto(id),
    CONSTRAINT fk_mrp_meta_resultado FOREIGN KEY (meta_resultado_id) REFERENCES meta_resultado(id)
);

-- Tabla: poai_historial_cambios
CREATE TABLE poai_historial_cambios (
    id SERIAL PRIMARY KEY,
    poai_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    fecha_cambio TIMESTAMPTZ DEFAULT NOW(),
    datos_poai JSONB,
    CONSTRAINT fk_poai_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_poai_historial_poai FOREIGN KEY (poai_id) REFERENCES poai(id)
);

-- ================================================================
-- 3. TRIGGERS
-- ================================================================

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rol_updated_at
    BEFORE UPDATE ON rol
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_area_updated_at
    BEFORE UPDATE ON area
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ods_updated_at
    BEFORE UPDATE ON ods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enfoque_poblacional_updated_at
    BEFORE UPDATE ON enfoque_poblacional
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuentes_financiacion_updated_at
    BEFORE UPDATE ON fuentes_financiacion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_caracterizacion_mga_updated_at
    BEFORE UPDATE ON caracterizacion_mga
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entidad_territorial_updated_at
    BEFORE UPDATE ON entidad_territorial
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_linea_estrategica_updated_at
    BEFORE UPDATE ON linea_estrategica
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programa_updated_at
    BEFORE UPDATE ON programa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meta_resultado_updated_at
    BEFORE UPDATE ON meta_resultado
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meta_producto_updated_at
    BEFORE UPDATE ON meta_producto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuario_area_updated_at
    BEFORE UPDATE ON usuario_area
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banco_proyectos_updated_at
    BEFORE UPDATE ON banco_proyectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poai_updated_at
    BEFORE UPDATE ON poai
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topes_presupuestales_updated_at
    BEFORE UPDATE ON topes_presupuestales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programacion_financiera_updated_at
    BEFORE UPDATE ON programacion_financiera
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programacion_fisica_updated_at
    BEFORE UPDATE ON programacion_fisica
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyecto_metas_updated_at
    BEFORE UPDATE ON proyecto_metas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metas_resultado_producto_updated_at
    BEFORE UPDATE ON metas_resultado_producto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 4. ÍNDICES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_poai_historial_poai_id ON poai_historial_cambios(poai_id);
CREATE INDEX IF NOT EXISTS idx_poai_historial_fecha ON poai_historial_cambios(fecha_cambio);
CREATE INDEX IF NOT EXISTS idx_poai_historial_usuario ON poai_historial_cambios(usuario_id);

-- ================================================================
-- 5. FUNCIÓN RPC PARA REPORTES
-- ================================================================

-- Función para generar reporte de periodo POAI
CREATE OR REPLACE FUNCTION generar_reporte_periodo_poai(
    p_año INTEGER,
    p_user_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_fecha_reporte TIMESTAMPTZ := NOW();
    v_periodo INTEGER;
    v_usuario_data JSONB;
    v_estado_actual JSONB;
    v_result JSONB;
    v_poai_id INTEGER;
BEGIN
    -- Mapear año a período
    v_periodo := CASE p_año
        WHEN 2024 THEN 1
        WHEN 2025 THEN 2
        WHEN 2026 THEN 3
        WHEN 2027 THEN 4
        ELSE NULL
    END;

    IF v_periodo IS NULL THEN
        RAISE EXCEPTION 'Año % no válido. Solo se permiten años entre 2024-2027', p_año;
                END IF;

    -- Obtener POAI ID
    SELECT id INTO v_poai_id
    FROM poai
    WHERE periodo = v_periodo;

    IF v_poai_id IS NULL THEN
        RAISE EXCEPTION 'No existe POAI para el año % (periodo %)', p_año, v_periodo;
        END IF;

    -- 1. OBTENER DATOS DEL USUARIO (buscar por identificacion)
    SELECT jsonb_build_object(
        'id', u.id,
        'nombre', u.nombre,
        'apellido', u.apellido,
        'area', jsonb_build_object(
            'id', a.id,
            'nombre', a.nombre,
            'responsable', a.responsable
        )
    ) INTO v_usuario_data
    FROM usuarios u
    LEFT JOIN usuario_area ua ON u.id = ua.usuario_id
    LEFT JOIN area a ON ua.area_id = a.id
    WHERE u.identificacion = p_user_id::TEXT
    LIMIT 1;

    -- 2. CAPTURAR ESTADO ACTUAL COMPLETO DEL PERIODO
    v_estado_actual := jsonb_build_object(
        'banco_proyectos', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', bp.id,
                    'nombre', bp.nombre,
                    'codigo_bpin', bp.codigo_bpin,
                    'descripcion', bp.descripcion,
                    'periodo', bp.periodo,
                    'created_at', bp.created_at,
                    'updated_at', bp.updated_at
                )
            ), '[]'::jsonb)
            FROM banco_proyectos bp
            WHERE bp.periodo = v_periodo
        ),
        'topes_presupuestales', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', tp.id,
                    'fuente_id', tp.fuente_id,
                    'tope_maximo', tp.tope_maximo,
                    'descripcion', tp.descripcion,
                    'periodo', tp.periodo,
                    'created_at', tp.created_at,
                    'updated_at', tp.updated_at,
                    'fuentes_financiacion', jsonb_build_object(
                        'id', ff.id,
                        'nombre', ff.nombre,
                        'marco_normativo', ff.marco_normativo
                    )
                )
            ), '[]'::jsonb)
                FROM topes_presupuestales tp
            LEFT JOIN fuentes_financiacion ff ON tp.fuente_id = ff.id
            WHERE tp.periodo = v_periodo
        ),
        'programacion_financiera', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', pf.id,
                    'meta_id', pf.meta_id,
                    'fuente_id', pf.fuente_id,
                    'periodo_uno', pf.periodo_uno,
                    'periodo_dos', pf.periodo_dos,
                    'periodo_tres', pf.periodo_tres,
                    'periodo_cuatro', pf.periodo_cuatro,
                    'total_cuatrienio', pf.total_cuatrienio,
                    'created_at', pf.created_at,
                    'updated_at', pf.updated_at
                )
            ), '[]'::jsonb)
                FROM programacion_financiera pf
            WHERE CASE v_periodo
                WHEN 1 THEN pf.periodo_uno > 0
                WHEN 2 THEN pf.periodo_dos > 0
                WHEN 3 THEN pf.periodo_tres > 0
                WHEN 4 THEN pf.periodo_cuatro > 0
                ELSE false
            END
        ),
        'programacion_fisica', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', pf.id,
                    'meta_id', pf.meta_id,
                    'periodo_uno', pf.periodo_uno,
                    'periodo_dos', pf.periodo_dos,
                    'periodo_tres', pf.periodo_tres,
                    'periodo_cuatro', pf.periodo_cuatro,
                    'total_cuatrienio', pf.total_cuatrienio,
                    'created_at', pf.created_at,
                    'updated_at', pf.updated_at
                )
            ), '[]'::jsonb)
            FROM programacion_fisica pf
            WHERE CASE v_periodo
                WHEN 1 THEN pf.periodo_uno > 0
                WHEN 2 THEN pf.periodo_dos > 0
                WHEN 3 THEN pf.periodo_tres > 0
                WHEN 4 THEN pf.periodo_cuatro > 0
                ELSE false
            END
        )
    );

    -- 3. GUARDAR EN HISTORIAL
                INSERT INTO poai_historial_cambios (
        poai_id,
        usuario_id,
        fecha_cambio,
        datos_poai
                ) VALUES (
        v_poai_id,
        (SELECT id FROM usuarios WHERE identificacion = p_user_id::TEXT),
        v_fecha_reporte,
        v_estado_actual
    );

    -- 4. CONSTRUIR RESULTADO
    v_result := jsonb_build_object(
        'fecha_reporte', v_fecha_reporte,
        'usuario_reporte', v_usuario_data,
        'periodo', v_periodo,
        'año', p_año,
        'estado_actual', v_estado_actual,
        'resumen', jsonb_build_object(
            'total_proyectos', jsonb_array_length(v_estado_actual->'banco_proyectos'),
            'total_topes', jsonb_array_length(v_estado_actual->'topes_presupuestales'),
            'total_programacion_financiera', jsonb_array_length(v_estado_actual->'programacion_financiera'),
            'total_programacion_fisica', jsonb_array_length(v_estado_actual->'programacion_fisica')
        )
    );

    RETURN v_result;
END;
$$;

-- ================================================================
-- MIGRACIÓN: Actualizar tabla meta_producto para nuevos campos
-- ================================================================

-- 1. Agregar nuevos campos JSONB para enfoques
ALTER TABLE meta_producto
ADD COLUMN IF NOT EXISTS enfoque_poblacional_ids JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS enfoque_territorial_ids JSONB DEFAULT '[]';

-- 2. Agregar nuevos campos para MGA
ALTER TABLE meta_producto
ADD COLUMN IF NOT EXISTS codigo_programa VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS codigo_producto VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS codigo_sector VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS unidad_medida_indicador_producto VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS nombre_indicador VARCHAR DEFAULT '';

-- 3. Cambiar tipo de datos de linea_base de VARCHAR a NUMERIC
ALTER TABLE meta_producto
ALTER COLUMN linea_base TYPE NUMERIC USING CASE
    WHEN linea_base IS NULL OR linea_base = '' THEN NULL
    ELSE linea_base::NUMERIC
END;

-- 4. Migrar datos existentes de enfoque_poblacional_id a enfoque_poblacional_ids
UPDATE meta_producto
SET enfoque_poblacional_ids = CASE
    WHEN enfoque_poblacional_id IS NOT NULL THEN json_build_array(enfoque_poblacional_id)
    ELSE '[]'::jsonb
END
WHERE enfoque_poblacional_ids IS NULL OR enfoque_poblacional_ids = '[]';

-- 5. Migrar datos existentes de enfoque_territorial a enfoque_territorial_ids
-- Asumiendo que enfoque_territorial contiene valores como 'urbano', 'rural', etc.
-- Necesitarás mapear estos valores a IDs de la tabla enfoque_territorial
UPDATE meta_producto
SET enfoque_territorial_ids = CASE
    WHEN enfoque_territorial = 'urbano' THEN '[1]'::jsonb
    WHEN enfoque_territorial = 'rural' THEN '[2]'::jsonb
    WHEN enfoque_territorial = 'mixto' THEN '[1,2]'::jsonb
    ELSE '[]'::jsonb
END
WHERE enfoque_territorial_ids IS NULL OR enfoque_territorial_ids = '[]';

-- 6. Eliminar columnas antiguas (OPCIONAL - hacer después de verificar que todo funciona)
-- ALTER TABLE meta_producto DROP COLUMN IF EXISTS enfoque_poblacional_id;
-- ALTER TABLE meta_producto DROP COLUMN IF EXISTS enfoque_territorial;

-- 7. Crear índices para mejorar el rendimiento de consultas JSONB
CREATE INDEX IF NOT EXISTS idx_meta_producto_enfoque_poblacional_ids
ON meta_producto USING GIN (enfoque_poblacional_ids);

CREATE INDEX IF NOT EXISTS idx_meta_producto_enfoque_territorial_ids
ON meta_producto USING GIN (enfoque_territorial_ids);

-- ================================================================
-- Tabla: enfoque_territorial (si no existe)
-- ================================================================
CREATE TABLE IF NOT EXISTS enfoque_territorial (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar datos básicos de enfoque territorial si no existen
INSERT INTO enfoque_territorial (id, nombre, descripcion) VALUES
(1, 'Urbano', 'Enfoque territorial urbano'),
(2, 'Rural', 'Enfoque territorial rural')
ON CONFLICT (id) DO NOTHING;

-- Trigger para enfoque_territorial
CREATE TRIGGER update_enfoque_territorial_updated_at
    BEFORE UPDATE ON enfoque_territorial
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- AUDITORÍA PLAN INDICATIVO
-- ================================================================

-- Tabla de historial para snapshots del Plan Indicativo
CREATE TABLE IF NOT EXISTS plan_indicativo_historial (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    triggered_table TEXT NOT NULL,
    accion TEXT NOT NULL, -- INSERT | UPDATE | DELETE
    fecha_cambio TIMESTAMPTZ DEFAULT NOW(),
    snapshot JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pi_historial_fecha ON plan_indicativo_historial(fecha_cambio);
CREATE INDEX IF NOT EXISTS idx_pi_historial_usuario ON plan_indicativo_historial(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pi_historial_accion ON plan_indicativo_historial(accion);

-- Alinear tipo con usuarios.id (BIGINT) y crear FK
ALTER TABLE plan_indicativo_historial
    ALTER COLUMN usuario_id TYPE BIGINT USING usuario_id::BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_pi_historial_usuario'
          AND table_name = 'plan_indicativo_historial'
    ) THEN
        ALTER TABLE plan_indicativo_historial
            ADD CONSTRAINT fk_pi_historial_usuario FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id);
    END IF;
END $$;

-- Función para capturar el snapshot completo del Plan Indicativo
CREATE OR REPLACE FUNCTION capturar_snapshot_plan_indicativo(
    p_usuario_id BIGINT,
    p_triggered_table TEXT,
    p_accion TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_snapshot JSONB;
BEGIN
    -- Construir snapshot con las 6 tablas requeridas
    v_snapshot := jsonb_build_object(
        'linea_estrategica', (
            SELECT COALESCE(jsonb_agg(to_jsonb(le) - 'xmin'), '[]'::jsonb)
            FROM linea_estrategica le
        ),
        'programa', (
            SELECT COALESCE(jsonb_agg(to_jsonb(p) - 'xmin'), '[]'::jsonb)
            FROM programa p
        ),
        'meta_resultado', (
            SELECT COALESCE(jsonb_agg(to_jsonb(mr) - 'xmin'), '[]'::jsonb)
            FROM meta_resultado mr
        ),
        'meta_producto', (
            SELECT COALESCE(jsonb_agg(to_jsonb(mp) - 'xmin'), '[]'::jsonb)
            FROM meta_producto mp
        ),
        'programacion_financiera', (
            SELECT COALESCE(jsonb_agg(to_jsonb(pf) - 'xmin'), '[]'::jsonb)
            FROM programacion_financiera pf
        ),
        'programacion_fisica', (
            SELECT COALESCE(jsonb_agg(to_jsonb(pfis) - 'xmin'), '[]'::jsonb)
            FROM programacion_fisica pfis
        )
    );

    -- Insertar en historial
    INSERT INTO plan_indicativo_historial(
        usuario_id,
        triggered_table,
        accion,
        snapshot
    ) VALUES (
        p_usuario_id,
        p_triggered_table,
        UPPER(p_accion),
        v_snapshot
    );
END;
$$;

