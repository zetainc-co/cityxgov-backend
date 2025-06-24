-- ================================================================
-- SCRIPT PARA CREAR BASE DE DATOS
-- Sistema de Gestión Estratégica
-- Archivo: database_script.sql
-- Base de datos: Supabase
-- Fecha: 2025-05-28
-- ================================================================

-- ================================================================
-- 1. FUNCIÓN PARA TRIGGER DE UPDATE_AT (Se crea una sola vez)
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

metas_resultado_producto

-- ================================================================
-- 2. TABLAS MAESTRAS (Sin dependencias)
-- ================================================================

-- Tabla: usuario
CREATE TABLE usuario (
    id  SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: rol
CREATE TABLE rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: area
CREATE TABLE area (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: ods
CREATE TABLE ods (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: enfoque_poblacional
CREATE TABLE enfoque_poblacional (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: fuentes_financiacion
CREATE TABLE fuentes_financiacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
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
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
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
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
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
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_programa_linea_estrategica
        FOREIGN KEY (linea_estrategica_id) REFERENCES linea_estrategica(id)
);

-- Tabla: meta_resultado
CREATE TABLE meta_resultado (
    id SERIAL PRIMARY KEY,
    linea_estrategica_id INTEGER NOT NULL,
    nombre VARCHAR NOT NULL,
    indicador VARCHAR,
    linea_base VARCHAR,
    año_linea_base INTEGER,
    meta_cuatrienio VARCHAR,
    fuente VARCHAR,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW(),
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
    valor VARCHAR,
    orientacion VARCHAR,
    sector VARCHAR,
    total_cuatrienio VARCHAR,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW(),
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
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_usuario_area_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_usuario_area_area
        FOREIGN KEY (area_id) REFERENCES area(id),
    CONSTRAINT fk_usuario_area_rol
        FOREIGN KEY (rol_id) REFERENCES rol(id)
);

-- Tabla: financiacion_periodo
CREATE TABLE financiacion_periodo (
    id SERIAL PRIMARY KEY,
    fuente_id INTEGER NOT NULL,
    meta_id INTEGER NOT NULL,
    periodo VARCHAR,
    fuente_financiacion VARCHAR,
    valor DECIMAL(15,2),
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_financiacion_periodo_fuente
        FOREIGN KEY (fuente_id) REFERENCES fuentes_financiacion(id),
    CONSTRAINT fk_financiacion_periodo_meta
        FOREIGN KEY (meta_id) REFERENCES meta_producto(id)
);

-- Tabla: metas_resultado_producto
CREATE TABLE metas_resultado_producto (
    id SERIAL PRIMARY KEY,
    meta_producto_id INTEGER NOT NULL,
    meta_resultado_id INTEGER NOT NULL,
    create_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_metas_resultado_producto_meta_producto
        FOREIGN KEY (meta_producto_id) REFERENCES meta_producto(id),
    CONSTRAINT fk_metas_resultado_producto_meta_resultado
        FOREIGN KEY (meta_resultado_id) REFERENCES meta_resultado(id),
    CONSTRAINT unique_meta_producto_resultado
        UNIQUE (meta_producto_id, meta_resultado_id)
);

-- ================================================================
-- 6. TRIGGERS PARA UPDATE_AT
-- ================================================================

-- Trigger para usuario
CREATE TRIGGER update_usuario_updated_at
    BEFORE UPDATE ON usuario
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
-- 7. COMENTARIOS PARA DOCUMENTACIÓN
-- ================================================================

-- Comentarios en tablas principales
COMMENT ON TABLE linea_estrategica IS 'Tabla que almacena las líneas estratégicas del plan de desarrollo';
COMMENT ON TABLE programa IS 'Programas asociados a cada línea estratégica';
COMMENT ON TABLE meta_resultado IS 'Metas de resultado asociadas a líneas estratégicas';
COMMENT ON TABLE meta_producto IS 'Metas de producto con sus caracterizaciones';
COMMENT ON TABLE usuario_area IS 'Relación entre usuarios, áreas y roles';
COMMENT ON TABLE financiacion_periodo IS 'Financiación por periodo para cada meta de producto';

-- ================================================================
