-- PostGIS spatial database initialization script
-- Schema and data for countries, regionss, cities

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS countries CASCADE;
CREATE TABLE countries (
    id serial PRIMARY KEY,
    geom geometry(POLYGON, 4326),
    name varchar,
    iso_code varchar,
    shape_id varchar,
    group_code varchar,
    type varchar
);

DROP TABLE IF EXISTS regions CASCADE;
CREATE TABLE regions (
    id serial PRIMARY KEY,
    geom geometry(GEOMETRY, 4326),
    name varchar,
    iso_code varchar,
    shape_id varchar,
    group_code varchar,
    type varchar
);

DROP TABLE IF EXISTS cities CASCADE;
CREATE TABLE cities (
    id serial PRIMARY KEY,
    regions_id integer REFERENCES regions(id),
    name varchar,
    geom geometry(POINT, 4326)
);

INSERT INTO countries (id, geom, name, iso_code, shape_id, group_code, type) VALUES
    (1, NULL, 'Ukraine', 'UA', '14850775B22712718081001', 'UKR', 'ADM0');

INSERT INTO regions (id, geom, name, iso_code, shape_id, group_code, type) VALUES
    (1, NULL, 'Kherson Oblast', 'UA-65', '14850775B65901307765467', 'UKR', 'ADM1'),
    (2, NULL, 'Volyn Oblast', 'UA-07', '14850775B13681962240800', 'UKR', 'ADM1'),
    (3, NULL, 'Rivne Oblast', 'UA-56', '14850775B83802928232754', 'UKR', 'ADM1'),
    (4, NULL, 'Zhytomyr Oblast', 'UA-18', '14850775B79197734087513', 'UKR', 'ADM1'),
    (5, NULL, 'Kyiv Oblast', 'UA-32', '14850775B37539954297462', 'UKR', 'ADM1'),
    (6, NULL, 'Chernihiv Oblast', 'UA-74', '14850775B55286662261645', 'UKR', 'ADM1'),
    (7, NULL, 'Sumy Oblast', 'UA-59', '14850775B14512392274127', 'UKR', 'ADM1'),
    (8, NULL, 'Kharkiv Oblast', 'UA-63', '14850775B15913324833724', 'UKR', 'ADM1'),
    (9, NULL, 'Luhansk Oblast', 'UA-09', '14850775B31033086218351', 'UKR', 'ADM1'),
    (10, NULL, 'Donetsk Oblast', 'UA-14', '14850775B15615817748403', 'UKR', 'ADM1'),
    (11, NULL, 'Zaporizhia Oblast', 'UA-23', '14850775B92888097715572', 'UKR', 'ADM1'),
    (12, NULL, 'Lviv Oblast', 'UA-46', '14850775B26941409899318', 'UKR', 'ADM1'),
    (13, NULL, 'Ivano-Frankivsk Oblast', 'UA-26', '14850775B19104561075165', 'UKR', 'ADM1'),
    (14, NULL, 'Zakarpattia Oblast', 'UA-21', '14850775B82824220650579', 'UKR', 'ADM1'),
    (15, NULL, 'Ternopil Oblast', 'UA-61', '14850775B81694531118507', 'UKR', 'ADM1'),
    (16, NULL, 'Chernivtsi Oblast', 'UA-77', '14850775B35593196550103', 'UKR', 'ADM1'),
    (17, NULL, 'Odessa Oblast', 'UA-51', '14850775B53240635394722', 'UKR', 'ADM1'),
    (18, NULL, 'Mykolaiv Oblast', 'UA-48', '14850775B99856317748721', 'UKR', 'ADM1'),
    (19, NULL, 'Autonomous Republic of Crimea', 'UA-43', '14850775B24260608407062', 'UKR', 'ADM1'),
    (20, NULL, 'Vinnytsia Oblast', 'UA-05', '14850775B93300237551625', 'UKR', 'ADM1'),
    (21, NULL, 'Khmelnytskyi Oblast', 'UA-68', '14850775B78366470925827', 'UKR', 'ADM1'),
    (22, NULL, 'Cherkasy Oblast', 'UA-71', '14850775B95678810793770', 'UKR', 'ADM1'),
    (23, NULL, 'Poltava Oblast', 'UA-53', '14850775B18105645488844', 'UKR', 'ADM1'),
    (24, NULL, 'Dnipropetrovsk Oblast', 'UA-12', '14850775B41808765507575', 'UKR', 'ADM1'),
    (25, NULL, 'Kirovohrad Oblast', 'UA-35', '14850775B64193679462794', 'UKR', 'ADM1'),
    (26, NULL, 'Kyiv', 'UA-30', '14850775B22712718081002', 'UKR', 'ADM1'),
    (27, NULL, 'Sevastopol', 'UA-40', '14850775B70667807354554', 'UKR', 'ADM1');


INSERT INTO cities (regions_id, name, geom) VALUES
    (26, 'Kyiv', NULL),
    (20, 'Vinnytsia', NULL),
    (2, 'Lutsk', NULL),
    (24, 'Dnipro', NULL),
    (10, 'Donetsk', NULL),
    (4, 'Zhytomyr', NULL),
    (14, 'Uzhhorod', NULL),
    (11, 'Zaporizhzhia', NULL),
    (13, 'Ivano-Frankivsk', NULL),
    (25, 'Kropyvnytskyi', NULL),
    (9, 'Luhansk', NULL),
    (12, 'Lviv', NULL),
    (18, 'Mykolaiv', NULL),
    (17, 'Odesa', NULL),
    (23, 'Poltava', NULL),
    (3, 'Rivne', NULL),
    (7, 'Sumy', NULL),
    (15, 'Ternopil', NULL),
    (8, 'Kharkiv', NULL),
    (1, 'Kherson', NULL),
    (21, 'Khmelnytskyi', NULL),
    (22, 'Cherkasy', NULL),
    (16, 'Chernivtsi', NULL),
    (6, 'Chernihiv', NULL),
    (27, 'Sevastopol', NULL),
    (19, 'Simferopol', NULL),
    (10, 'Kramatorsk', NULL);
