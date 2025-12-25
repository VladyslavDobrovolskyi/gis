-- Подключаем расширение PostGIS (если еще не подключено)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Создаем таблицу городов
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    population INTEGER,
    location GEOMETRY(POINT, 4326) -- SRID 4326 = WGS84
);

-- Вставляем несколько примеров городов
INSERT INTO cities (name, population, location)
VALUES
    ('Kyiv', 2950000, ST_SetSRID(ST_MakePoint(30.5234, 50.4501), 4326)),
    ('Lviv', 721301, ST_SetSRID(ST_MakePoint(24.0316, 49.8397), 4326)),
    ('Odesa', 1011000, ST_SetSRID(ST_MakePoint(30.7326, 46.4775), 4326)),
    ('Dnipro', 1006000, ST_SetSRID(ST_MakePoint(34.9830, 48.4647), 4326));

-- Проверяем данные
SELECT id, name, population, ST_AsText(location) AS geom
FROM cities;