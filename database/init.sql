-- =========================
-- Extensions
-- =========================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;

-- =========================
-- Reference tables
-- =========================

-- Типы объектов
CREATE TABLE geo_object_type (
    id SMALLSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO geo_object_type (code, description) VALUES
    ('COUNTRY', 'Country boundary'),
    ('CITY', 'City center'),
    ('CITY_BORDER', 'City administrative boundary'),
    ('CITY_CLUSTER', 'Group of cities'),
    ('ROUTE', 'Route'),
    ('ELEVATION_POINT', 'Point with elevation');

-- =========================
-- Core entities
-- =========================

-- Гео-объекты (логическая сущность)
CREATE TABLE geo_object (
    id SERIAL PRIMARY KEY,
    type_id SMALLINT NOT NULL REFERENCES geo_object_type(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- Geometry storage
-- =========================

-- POINT / POINT Z
CREATE TABLE geo_point (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    geom geometry(Point, 4326),
    geom_z geometry(PointZ, 4326)
);

CREATE INDEX idx_geo_point_geom ON geo_point USING GIST (geom);

-- MULTIPOINT
CREATE TABLE geo_multipoint (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    geom geometry(MultiPoint, 4326)
);

CREATE INDEX idx_geo_multipoint_geom ON geo_multipoint USING GIST (geom);

-- MULTILINESTRING
CREATE TABLE geo_multiline (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    geom geometry(MultiLineString, 4326)
);

CREATE INDEX idx_geo_multiline_geom ON geo_multiline USING GIST (geom);

-- LINESTRING M
CREATE TABLE geo_line_m (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    geom geometry(LineStringM, 4326)
);

CREATE INDEX idx_geo_line_m_geom ON geo_line_m USING GIST (geom);

-- LINESTRING ZM
CREATE TABLE geo_line_zm (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    geom geometry(LineStringZM, 4326)
);

CREATE INDEX idx_geo_line_zm_geom ON geo_line_zm USING GIST (geom);

-- MULTIPOLYGON (например, границы страны)
CREATE TABLE geo_multipolygon (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    geom geometry(MultiPolygon, 4326)
);

CREATE INDEX idx_geo_multipolygon_geom ON geo_multipolygon USING GIST (geom);

-- GEOGRAPHY (точные расчёты)
CREATE TABLE geo_geography (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    geog geography(Point, 4326)
);

CREATE INDEX idx_geo_geography_geog ON geo_geography USING GIST (geog);

-- GEOMETRYCOLLECTION
CREATE TABLE geo_collection (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    geom geometry(GeometryCollection, 4326)
);

CREATE INDEX idx_geo_collection_geom ON geo_collection USING GIST (geom);

-- RASTER
CREATE TABLE geo_raster (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id) ON DELETE CASCADE,
    rast raster
);

-- =========================
-- Domain tables
-- =========================

-- Страны
CREATE TABLE country (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id),
    iso_code CHAR(2) UNIQUE NOT NULL
);

-- Города
CREATE TABLE city (
    geo_object_id INTEGER PRIMARY KEY REFERENCES geo_object(id),
    population INTEGER
);

-- =========================
-- Seed data
-- =========================

-- Украина
WITH country_obj AS (
    INSERT INTO geo_object (type_id, name)
    VALUES ((SELECT id FROM geo_object_type WHERE code = 'COUNTRY'), 'Ukraine')
    RETURNING id
)
INSERT INTO geo_multipolygon (geo_object_id, geom)
SELECT id,
    ST_Multi(
        ST_GeomFromText(
            'POLYGON((
                22 44,
                40 44,
                40 52,
                22 52,
                22 44
            ))',
            4326
        )
    )
FROM country_obj;

-- Привязка geo_object к таблице country
INSERT INTO country (geo_object_id, iso_code)
SELECT id, 'UA' FROM geo_object WHERE name = 'Ukraine' AND type_id = (SELECT id FROM geo_object_type WHERE code = 'COUNTRY');


-- Города: Kyiv, Kharkiv, Odesa, Dnipro, Lviv
WITH cities AS (
    INSERT INTO geo_object (type_id, name) VALUES
        ((SELECT id FROM geo_object_type WHERE code = 'CITY'), 'Kyiv'),
        ((SELECT id FROM geo_object_type WHERE code = 'CITY'), 'Kharkiv'),
        ((SELECT id FROM geo_object_type WHERE code = 'CITY'), 'Odesa'),
        ((SELECT id FROM geo_object_type WHERE code = 'CITY'), 'Dnipro'),
        ((SELECT id FROM geo_object_type WHERE code = 'CITY'), 'Lviv')
    RETURNING id, name
)
INSERT INTO city (geo_object_id, population)
SELECT id, CASE name
    WHEN 'Kyiv' THEN 2884000
    WHEN 'Kharkiv' THEN 1441000
    WHEN 'Odesa' THEN 1011000
    WHEN 'Dnipro' THEN 968000
    WHEN 'Lviv' THEN 721000
    ELSE 0 END
FROM cities;

WITH cities AS (
    SELECT id, name FROM geo_object WHERE name IN ('Kyiv','Kharkiv','Odesa','Dnipro','Lviv')
)
INSERT INTO geo_point (geo_object_id, geom)
SELECT id, CASE name
    WHEN 'Kyiv' THEN ST_Point(30.5234, 50.4501)
    WHEN 'Kharkiv' THEN ST_Point(36.2304, 49.9935)
    WHEN 'Odesa' THEN ST_Point(30.7233, 46.4825)
    WHEN 'Dnipro' THEN ST_Point(35.0450, 48.4647)
    WHEN 'Lviv' THEN ST_Point(24.0311, 49.8429)
    ELSE NULL END
FROM cities;

WITH cities AS (
    SELECT id, name FROM geo_object WHERE name IN ('Kyiv','Kharkiv','Odesa','Dnipro','Lviv')
)
INSERT INTO geo_geography (geo_object_id, geog)
SELECT id, CASE name
    WHEN 'Kyiv' THEN ST_Point(30.5234, 50.4501)
    WHEN 'Kharkiv' THEN ST_Point(36.2304, 49.9935)
    WHEN 'Odesa' THEN ST_Point(30.7233, 46.4825)
    WHEN 'Dnipro' THEN ST_Point(35.0450, 48.4647)
    WHEN 'Lviv' THEN ST_Point(24.0311, 49.8429)
    ELSE NULL END
FROM cities;

WITH cities AS (
    SELECT id, name FROM geo_object WHERE name IN ('Kyiv','Kharkiv','Odesa','Dnipro','Lviv')
)
INSERT INTO geo_multipolygon (geo_object_id, geom)
SELECT id,
    ST_Multi(
        ST_GeomFromText(
            CASE name
                WHEN 'Kyiv' THEN 'POLYGON((30.35 50.35, 30.80 50.35, 30.80 50.60, 30.35 50.60, 30.35 50.35))'
                WHEN 'Kharkiv' THEN 'POLYGON((36.10 49.90, 36.36 49.90, 36.36 50.05, 36.10 50.05, 36.10 49.90))'
                WHEN 'Odesa' THEN 'POLYGON((30.60 46.40, 30.85 46.40, 30.85 46.55, 30.60 46.55, 30.60 46.40))'
                WHEN 'Dnipro' THEN 'POLYGON((34.95 48.40, 35.15 48.40, 35.15 48.55, 34.95 48.55, 34.95 48.40))'
                WHEN 'Lviv' THEN 'POLYGON((23.90 49.75, 24.15 49.75, 24.15 49.95, 23.90 49.95, 23.90 49.75))'
                ELSE NULL END,
            4326
        )
    )
FROM cities;
