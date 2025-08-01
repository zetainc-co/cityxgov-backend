-- ================================================================
-- SCRIPT PARA CREAR BASE DE DATOS
-- Sistema de Gestión Estratégica
-- Archivo: database_script.sql
-- Base de datos: Supabase
-- Fecha: 2025-01-21
-- Actualizado: 2025-01-21
-- Autor: Yedixon Ramones
-- Versión: 1.1.0 (Actualizado con nuevos campos y tabla entidad_territorial)
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
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    identificacion VARCHAR,
    nombre VARCHAR NOT NULL,
    apellido VARCHAR,
    descripcion TEXT,
    correo VARCHAR,
    telefono VARCHAR,
    activo BOOLEAN DEFAULT true,
    contrasena VARCHAR,
    avatar VARCHAR,
    token VARCHAR,
    cargo VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: rol
CREATE TABLE rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: area (ACTUALIZADA con nuevos campos)
CREATE TABLE area (
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
CREATE TABLE ods (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: enfoque_poblacional
CREATE TABLE enfoque_poblacional (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: fuentes_financiacion
CREATE TABLE fuentes_financiacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    marco_normativo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: caracterizacion_mga
CREATE TABLE caracterizacion_mga (
    id SERIAL PRIMARY KEY,
    sector_codigo INTEGER,
    sector_nombre VARCHAR,
    programa_codigo INTEGER,
    programa_nombre VARCHAR,
    producto_codigo INTEGER,
    producto_nombre VARCHAR,
    indicador_codigo INTEGER,
    indicador_nombre VARCHAR,
    unidad_medida VARCHAR,
    subprograma_codigo INTEGER,
    subprograma_nombre VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: entidad_territorial (NUEVA TABLA)
CREATE TABLE entidad_territorial (
    id SERIAL PRIMARY KEY,
    nombre_entidad VARCHAR NOT NULL,
    nombre_representante VARCHAR,
    nit VARCHAR,
    nombre_municipio VARCHAR,
    departamento VARCHAR,
    region VARCHAR,
    categoria_municipal VARCHAR,
    poblacion INTEGER,
    latitud NUMERIC(10,8),
    longitud NUMERIC(11,8),
    direccion_completa TEXT,
    tipo_municipio VARCHAR,
    imagenes TEXT,
    mapa_municipio TEXT,
    organigrama JSONB,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 3. TABLAS PRINCIPALES
-- ================================================================

-- Tabla: linea_estrategica
CREATE TABLE linea_estrategica (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    plan_nacional VARCHAR,
    plan_departamental VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 4. TABLAS DEPENDIENTES
-- ================================================================

-- Tabla: programa
CREATE TABLE programa (
    id SERIAL PRIMARY KEY,
    linea_estrategica_id INTEGER NOT NULL,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_programa_linea_estrategica
        FOREIGN KEY (linea_estrategica_id) REFERENCES linea_estrategica(id)
);

-- Tabla: meta_resultado (ACTUALIZADA con campo descripcion)
CREATE TABLE meta_resultado (
    id SERIAL PRIMARY KEY,
    linea_estrategica_id INTEGER NOT NULL,
    nombre VARCHAR NOT NULL,
    indicador VARCHAR,
    descripcion TEXT,
    linea_base VARCHAR,
    año_linea_base INTEGER,
    meta_cuatrienio VARCHAR,
    fuente VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_meta_resultado_linea_estrategica
        FOREIGN KEY (linea_estrategica_id) REFERENCES linea_estrategica(id)
);

-- Tabla: meta_producto
CREATE TABLE meta_producto (
    id SERIAL PRIMARY KEY,
    caracterizacion_mga_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    ods_id INTEGER NOT NULL,
    enfoque_poblacional_id INTEGER NOT NULL,
    codigo VARCHAR,
    linea_base VARCHAR,
    instrumento_planeacion VARCHAR,
    nombre VARCHAR NOT NULL,
    meta_numerica VARCHAR,
    orientacion VARCHAR,
    sector VARCHAR,
    total_cuatrienio VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_meta_producto_caracterizacion_mga
        FOREIGN KEY (caracterizacion_mga_id) REFERENCES caracterizacion_mga(id),
    CONSTRAINT fk_meta_producto_area
        FOREIGN KEY (area_id) REFERENCES area(id),
    CONSTRAINT fk_meta_producto_ods
        FOREIGN KEY (ods_id) REFERENCES ods(id),
    CONSTRAINT fk_meta_producto_enfoque_poblacional
        FOREIGN KEY (enfoque_poblacional_id) REFERENCES enfoque_poblacional(id)
);

-- ================================================================
-- 5. TABLAS DE RELACIÓN
-- ================================================================

-- Tabla: usuario_area
CREATE TABLE usuario_area (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    rol_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_area_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_usuario_area_area
        FOREIGN KEY (area_id) REFERENCES area(id),
    CONSTRAINT fk_usuario_area_rol
        FOREIGN KEY (rol_id) REFERENCES rol(id)
);

CREATE TABLE programacion_financiera (
    id SERIAL PRIMARY KEY,
    fuente_id INTEGER NOT NULL,
    meta_id INTEGER NOT NULL,
    periodo VARCHAR,
    valor NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_programacion_financiera_fuente
        FOREIGN KEY (fuente_id) REFERENCES fuentes_financiacion(id),
    CONSTRAINT fk_programacion_financiera_meta
        FOREIGN KEY (meta_id) REFERENCES meta_producto(id)
);

-- Tabla: financiacion_periodo
CREATE TABLE programacion_fisica (
    id SERIAL PRIMARY KEY,
    fuente_id INTEGER NOT NULL,
    meta_id INTEGER NOT NULL,
    periodo VARCHAR,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_programacion_fisica_fuente
        FOREIGN KEY (fuente_id) REFERENCES fuentes_financiacion(id),
    CONSTRAINT fk_programacion_fisica_meta
        FOREIGN KEY (meta_id) REFERENCES meta_producto(id)
);

-- Tabla: metas_resultado_producto
CREATE TABLE metas_resultado_producto (
    id SERIAL PRIMARY KEY,
    meta_producto_id INTEGER NOT NULL,
    meta_resultado_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_metas_resultado_producto_meta_producto
        FOREIGN KEY (meta_producto_id) REFERENCES meta_producto(id),
    CONSTRAINT fk_metas_resultado_producto_meta_resultado
        FOREIGN KEY (meta_resultado_id) REFERENCES meta_resultado(id)
);

-- ================================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- ================================================================

-- Trigger para usuarios
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para rol
CREATE TRIGGER update_rol_updated_at
    BEFORE UPDATE ON rol
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para area
CREATE TRIGGER update_area_updated_at
    BEFORE UPDATE ON area
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para ods
CREATE TRIGGER update_ods_updated_at
    BEFORE UPDATE ON ods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para enfoque_poblacional
CREATE TRIGGER update_enfoque_poblacional_updated_at
    BEFORE UPDATE ON enfoque_poblacional
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para fuentes_financiacion
CREATE TRIGGER update_fuentes_financiacion_updated_at
    BEFORE UPDATE ON fuentes_financiacion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para caracterizacion_mga
CREATE TRIGGER update_caracterizacion_mga_updated_at
    BEFORE UPDATE ON caracterizacion_mga
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para entidad_territorial (NUEVO TRIGGER)
CREATE TRIGGER update_entidad_territorial_updated_at
    BEFORE UPDATE ON entidad_territorial
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para linea_estrategica
CREATE TRIGGER update_linea_estrategica_updated_at
    BEFORE UPDATE ON linea_estrategica
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para programa
CREATE TRIGGER update_programa_updated_at
    BEFORE UPDATE ON programa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para meta_resultado
CREATE TRIGGER update_meta_resultado_updated_at
    BEFORE UPDATE ON meta_resultado
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para meta_producto
CREATE TRIGGER update_meta_producto_updated_at
    BEFORE UPDATE ON meta_producto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para usuario_area
CREATE TRIGGER update_usuario_area_updated_at
    BEFORE UPDATE ON usuario_area
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para financiacion_periodo
CREATE TRIGGER update_financiacion_periodo_updated_at
    BEFORE UPDATE ON financiacion_periodo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para metas_resultado_producto
CREATE TRIGGER update_metas_resultado_producto_updated_at
    BEFORE UPDATE ON metas_resultado_producto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================

-- Función RPC para buscar códigos MGA por prefijo
CREATE OR REPLACE FUNCTION search_mga_codes(
    search_term TEXT,
    max_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    id INTEGER,
    codigo_indicador INTEGER,
    producto TEXT,
    programa TEXT,
    sector TEXT,
    descripcion_producto TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que la función se ejecute con permisos de admin
AS $$
BEGIN
    -- Validar que search_term no esté vacío
    IF search_term IS NULL OR trim(search_term) = '' THEN
        RETURN;
    END IF;

    -- Validar que search_term solo contenga números
    IF search_term !~ '^\d+$' THEN
        RAISE EXCEPTION 'El término de búsqueda debe contener solo números';
    END IF;

    -- Retornar los resultados que empiecen con el término de búsqueda
    RETURN QUERY
    SELECT
        c.id::INTEGER,
        c.codigo_indicador::INTEGER,
        c.producto::TEXT,
        c.programa::TEXT,
        c.sector::TEXT,
        c.descripcion_producto::TEXT
    FROM caracterizacion_mga c
    WHERE c.codigo_indicador::TEXT ILIKE search_term || '%'
    ORDER BY c.codigo_indicador ASC
    LIMIT max_results;
END;
$$;

-- ================================================================
-- TABLA DE HISTORIAL DE CAMBIOS DEL POAI
-- ================================================================

-- Crear tabla para historial de cambios del POAI
CREATE TABLE IF NOT EXISTS poai_historial_cambios (
    id SERIAL PRIMARY KEY,
    poai_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_cambio VARCHAR(50) NOT NULL, -- 'BANCO_PROYECTOS', 'TOPES', 'PROGRAMACION_FINANCIERA', 'PROGRAMACION_FISICA'
    modulo_afectado VARCHAR(100) NOT NULL, -- 'banco_proyectos', 'topes_presupuestales', 'programacion_financiera', 'programacion_fisica'
    registro_id INTEGER, -- ID del registro específico que cambió
    datos_anteriores JSONB, -- Datos antes del cambio
    datos_nuevos JSONB, -- Datos después del cambio
    descripcion_cambio TEXT, -- Descripción humana del cambio
    resumen_cambios JSONB -- Resumen de todos los cambios en esta actualización
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_poai_historial_poai_id ON poai_historial_cambios(poai_id);
CREATE INDEX IF NOT EXISTS idx_poai_historial_fecha ON poai_historial_cambios(fecha_cambio);
CREATE INDEX IF NOT EXISTS idx_poai_historial_usuario ON poai_historial_cambios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_poai_historial_tipo ON poai_historial_cambios(tipo_cambio);

-- Agregar foreign keys
ALTER TABLE poai_historial_cambios
ADD CONSTRAINT fk_poai_historial_poai
FOREIGN KEY (poai_id) REFERENCES poai(id) ON DELETE CASCADE;

ALTER TABLE poai_historial_cambios
ADD CONSTRAINT fk_poai_historial_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- ================================================================
-- FUNCIÓN RPC PARA ACTUALIZACIÓN CON TRAZABILIDAD - CORREGIDA
-- ================================================================
CREATE OR REPLACE FUNCTION update_poai_complete_with_traceability(
    p_poai_id INTEGER,
    p_user_id INTEGER,
    p_update_data JSONB,
    p_periodo INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_historial_id INTEGER;
    v_cambios_detectados JSONB := '[]'::JSONB;
    v_resumen_cambios JSONB := '{}'::JSONB;
    v_old_data JSONB;
    v_new_data JSONB;
    v_cambio JSONB;
    v_descripcion TEXT;
    v_tipo_cambio VARCHAR(50);
    v_modulo_afectado VARCHAR(100);
    v_registro_id INTEGER;
    v_total_cambios INTEGER := 0;
BEGIN
    -- Iniciar transacción
    BEGIN
        -- 1. ACTUALIZAR BANCO DE PROYECTOS
        IF p_update_data ? 'banco_proyectos' THEN
            v_tipo_cambio := 'BANCO_PROYECTOS';
            v_modulo_afectado := 'banco_proyectos';

            -- Procesar cada proyecto en el banco
            FOR v_cambio IN SELECT * FROM jsonb_array_elements(p_update_data->'banco_proyectos')
            LOOP
                v_registro_id := (v_cambio->>'id')::INTEGER;
                v_total_cambios := v_total_cambios + 1;

                -- Obtener datos anteriores
                SELECT to_jsonb(bp.*) INTO v_old_data
                FROM banco_proyectos bp
                WHERE bp.id = v_registro_id AND bp.periodo = p_periodo;

                -- Actualizar proyecto según la acción
                IF v_cambio->>'action' = 'create' THEN
                    -- Crear nuevo proyecto
                    INSERT INTO banco_proyectos (
                        nombre, codigo_bpin, descripcion, periodo, created_at, updated_at
                    ) VALUES (
                        v_cambio->>'nombre',
                        v_cambio->>'codigo_bpin',
                        v_cambio->>'descripcion',
                        p_periodo,
                        NOW(),
                        NOW()
                    ) RETURNING id INTO v_registro_id;

                    v_descripcion := 'Creación de proyecto: ' || (v_cambio->>'nombre');
                    v_old_data := '{}'::JSONB;

                ELSIF v_cambio->>'action' = 'update' THEN
                    -- Actualizar proyecto existente
                    UPDATE banco_proyectos
                    SET
                        nombre = COALESCE(v_cambio->>'nombre', nombre),
                        codigo_bpin = COALESCE(v_cambio->>'codigo_bpin', codigo_bpin),
                        descripcion = COALESCE(v_cambio->>'descripcion', descripcion),
                        updated_at = NOW()
                    WHERE id = v_registro_id AND periodo = p_periodo;

                    v_descripcion := 'Actualización de proyecto: ' || (v_cambio->>'nombre');

                ELSIF v_cambio->>'action' = 'delete' THEN
                    -- Eliminar proyecto
                    DELETE FROM banco_proyectos
                    WHERE id = v_registro_id AND periodo = p_periodo;

                    v_descripcion := 'Eliminación de proyecto: ' || (v_old_data->>'nombre');
                    v_new_data := '{}'::JSONB;
                END IF;

                -- Obtener datos nuevos (si no es eliminación)
                IF v_cambio->>'action' != 'delete' THEN
                    SELECT to_jsonb(bp.*) INTO v_new_data
                    FROM banco_proyectos bp
                    WHERE bp.id = v_registro_id;
                END IF;

                -- Insertar en historial
                INSERT INTO poai_historial_cambios (
                    poai_id, usuario_id, tipo_cambio, modulo_afectado,
                    registro_id, datos_anteriores, datos_nuevos, descripcion_cambio
                ) VALUES (
                    p_poai_id, p_user_id, v_tipo_cambio, v_modulo_afectado,
                    v_registro_id, v_old_data, v_new_data, v_descripcion
                );

                -- Agregar al resumen de cambios
                v_cambios_detectados := v_cambios_detectados || jsonb_build_object(
                    'tipo', v_tipo_cambio,
                    'modulo', v_modulo_afectado,
                    'registro_id', v_registro_id,
                    'descripcion', v_descripcion
                );
            END LOOP;
        END IF;

        -- 2. ACTUALIZAR TOPES PRESUPUESTALES
        IF p_update_data ? 'topes_presupuestales' THEN
            v_tipo_cambio := 'TOPES_PRESUPUESTALES';
            v_modulo_afectado := 'topes_presupuestales';

            FOR v_cambio IN SELECT * FROM jsonb_array_elements(p_update_data->'topes_presupuestales')
            LOOP
                v_registro_id := (v_cambio->>'id')::INTEGER;
                v_total_cambios := v_total_cambios + 1;

                -- Obtener datos anteriores
                SELECT to_jsonb(tp.*) INTO v_old_data
                FROM topes_presupuestales tp
                WHERE tp.id = v_registro_id AND tp.periodo = p_periodo;

                -- Actualizar tope según la acción
                IF v_cambio->>'action' = 'create' THEN
                    -- Crear nuevo tope
                    INSERT INTO topes_presupuestales (
                        fuente_id, tope_maximo, descripcion, periodo, created_at, updated_at
                    ) VALUES (
                        (v_cambio->>'fuente_id')::INTEGER,
                        (v_cambio->>'tope_maximo')::NUMERIC,
                        v_cambio->>'descripcion',
                        p_periodo,
                        NOW(),
                        NOW()
                    ) RETURNING id INTO v_registro_id;

                    v_descripcion := 'Creación de tope presupuestal: ' || (v_cambio->>'tope_maximo');
                    v_old_data := '{}'::JSONB;

                ELSIF v_cambio->>'action' = 'update' THEN
                    -- Actualizar tope existente
                    UPDATE topes_presupuestales
                    SET
                        tope_maximo = COALESCE((v_cambio->>'tope_maximo')::NUMERIC, tope_maximo),
                        descripcion = COALESCE(v_cambio->>'descripcion', descripcion),
                        updated_at = NOW()
                    WHERE id = v_registro_id AND periodo = p_periodo;

                    v_descripcion := 'Actualización de tope presupuestal: ' ||
                                    (v_old_data->>'tope_maximo') || ' → ' || (v_cambio->>'tope_maximo');

                ELSIF v_cambio->>'action' = 'delete' THEN
                    -- Eliminar tope
                    DELETE FROM topes_presupuestales
                    WHERE id = v_registro_id AND periodo = p_periodo;

                    v_descripcion := 'Eliminación de tope presupuestal: ' || (v_old_data->>'tope_maximo');
                    v_new_data := '{}'::JSONB;
                END IF;

                -- Obtener datos nuevos (si no es eliminación)
                IF v_cambio->>'action' != 'delete' THEN
                    SELECT to_jsonb(tp.*) INTO v_new_data
                    FROM topes_presupuestales tp
                    WHERE tp.id = v_registro_id;
                END IF;

                -- Insertar en historial
                INSERT INTO poai_historial_cambios (
                    poai_id, usuario_id, tipo_cambio, modulo_afectado,
                    registro_id, datos_anteriores, datos_nuevos, descripcion_cambio
                ) VALUES (
                    p_poai_id, p_user_id, v_tipo_cambio, v_modulo_afectado,
                    v_registro_id, v_old_data, v_new_data, v_descripcion
                );

                -- Agregar al resumen de cambios
                v_cambios_detectados := v_cambios_detectados || jsonb_build_object(
                    'tipo', v_tipo_cambio,
                    'modulo', v_modulo_afectado,
                    'registro_id', v_registro_id,
                    'descripcion', v_descripcion
                );
            END LOOP;
        END IF;

        -- 3. ACTUALIZAR PROGRAMACIÓN FINANCIERA
        IF p_update_data ? 'programacion_financiera' THEN
            v_tipo_cambio := 'PROGRAMACION_FINANCIERA';
            v_modulo_afectado := 'programacion_financiera';

            FOR v_cambio IN SELECT * FROM jsonb_array_elements(p_update_data->'programacion_financiera')
            LOOP
                v_registro_id := (v_cambio->>'id')::INTEGER;
                v_total_cambios := v_total_cambios + 1;

                -- Obtener datos anteriores
                SELECT to_jsonb(pf.*) INTO v_old_data
                FROM programacion_financiera pf
                WHERE pf.id = v_registro_id;

                -- Actualizar programación financiera
                UPDATE programacion_financiera
                SET
                    periodo_uno = COALESCE((v_cambio->>'periodo_uno')::NUMERIC, periodo_uno),
                    periodo_dos = COALESCE((v_cambio->>'periodo_dos')::NUMERIC, periodo_dos),
                    periodo_tres = COALESCE((v_cambio->>'periodo_tres')::NUMERIC, periodo_tres),
                    periodo_cuatro = COALESCE((v_cambio->>'periodo_cuatro')::NUMERIC, periodo_cuatro),
                    total_cuatrienio = COALESCE((v_cambio->>'total_cuatrienio')::NUMERIC, total_cuatrienio),
                    updated_at = NOW()
                WHERE id = v_registro_id;

                -- Obtener datos nuevos
                SELECT to_jsonb(pf.*) INTO v_new_data
                FROM programacion_financiera pf
                WHERE pf.id = v_registro_id;

                -- Crear descripción del cambio
                v_descripcion := 'Actualización programación financiera - Meta ID: ' || (v_cambio->>'meta_id');

                -- Insertar en historial
                INSERT INTO poai_historial_cambios (
                    poai_id, usuario_id, tipo_cambio, modulo_afectado,
                    registro_id, datos_anteriores, datos_nuevos, descripcion_cambio
                ) VALUES (
                    p_poai_id, p_user_id, v_tipo_cambio, v_modulo_afectado,
                    v_registro_id, v_old_data, v_new_data, v_descripcion
                );

                -- Agregar al resumen de cambios
                v_cambios_detectados := v_cambios_detectados || jsonb_build_object(
                    'tipo', v_tipo_cambio,
                    'modulo', v_modulo_afectado,
                    'registro_id', v_registro_id,
                    'descripcion', v_descripcion
                );
            END LOOP;
        END IF;

        -- 4. ACTUALIZAR PROGRAMACIÓN FÍSICA
        IF p_update_data ? 'programacion_fisica' THEN
            v_tipo_cambio := 'PROGRAMACION_FISICA';
            v_modulo_afectado := 'programacion_fisica';

            FOR v_cambio IN SELECT * FROM jsonb_array_elements(p_update_data->'programacion_fisica')
            LOOP
                v_registro_id := (v_cambio->>'id')::INTEGER;
                v_total_cambios := v_total_cambios + 1;

                -- Obtener datos anteriores
                SELECT to_jsonb(pf.*) INTO v_old_data
                FROM programacion_fisica pf
                WHERE pf.id = v_registro_id;

                -- Actualizar programación física
                UPDATE programacion_fisica
                SET
                    periodo_uno = COALESCE((v_cambio->>'periodo_uno')::NUMERIC, periodo_uno),
                    periodo_dos = COALESCE((v_cambio->>'periodo_dos')::NUMERIC, periodo_dos),
                    periodo_tres = COALESCE((v_cambio->>'periodo_tres')::NUMERIC, periodo_tres),
                    periodo_cuatro = COALESCE((v_cambio->>'periodo_cuatro')::NUMERIC, periodo_cuatro),
                    total_cuatrienio = COALESCE((v_cambio->>'total_cuatrienio')::NUMERIC, total_cuatrienio),
                    updated_at = NOW()
                WHERE id = v_registro_id;

                -- Obtener datos nuevos
                SELECT to_jsonb(pf.*) INTO v_new_data
                FROM programacion_fisica pf
                WHERE pf.id = v_registro_id;

                -- Crear descripción del cambio
                v_descripcion := 'Actualización programación física - Meta ID: ' || (v_cambio->>'meta_id');

                -- Insertar en historial
                INSERT INTO poai_historial_cambios (
                    poai_id, usuario_id, tipo_cambio, modulo_afectado,
                    registro_id, datos_anteriores, datos_nuevos, descripcion_cambio
                ) VALUES (
                    p_poai_id, p_user_id, v_tipo_cambio, v_modulo_afectado,
                    v_registro_id, v_old_data, v_new_data, v_descripcion
                );

                -- Agregar al resumen de cambios
                v_cambios_detectados := v_cambios_detectados || jsonb_build_object(
                    'tipo', v_tipo_cambio,
                    'modulo', v_modulo_afectado,
                    'registro_id', v_registro_id,
                    'descripcion', v_descripcion
                );
            END LOOP;
        END IF;

        -- Crear resumen final
        v_resumen_cambios := jsonb_build_object(
            'periodo', p_periodo,
            'usuario_id', p_user_id,
            'total_cambios', v_total_cambios,
            'cambios_detallados', v_cambios_detectados,
            'fecha_actualizacion', NOW()
        );

        RETURN v_resumen_cambios;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback automático en caso de error
            RAISE EXCEPTION 'Error en actualización POAI: %', SQLERRM;
    END;
END;
$$;

