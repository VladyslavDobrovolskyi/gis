-- PostGIS spatial database initialization script
-- Schema and data for countries, regions, cities

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table: countries
DROP TABLE IF EXISTS countries CASCADE;
CREATE TABLE countries (
	ogc_fid serial PRIMARY KEY,
	wkb_geometry geometry(POLYGON, 4326),
	shapename varchar,
	shapeiso varchar,
	shapeid varchar,
	shapegroup varchar,
	shapetype varchar
);

-- Table: regions
DROP TABLE IF EXISTS regions CASCADE;
CREATE TABLE regions (
	ogc_fid serial PRIMARY KEY,
	wkb_geometry geometry(GEOMETRY, 4326),
	shapename varchar,
	shapeiso varchar,
	shapeid varchar,
	shapegroup varchar,
	shapetype varchar
);

-- Table: cities
DROP TABLE IF EXISTS cities CASCADE;
CREATE TABLE cities (
	id serial PRIMARY KEY,
	region_id integer REFERENCES regions(ogc_fid),
	city_name varchar,
	geom geometry(POINT, 4326)
);

-- Data for countries
INSERT INTO countries (ogc_fid, wkb_geometry, shapename, shapeiso, shapeid, shapegroup, shapetype) VALUES
	(1, NULL, 'Ukraine', 'UA', '14850775B22712718081001', 'UKR', 'ADM0');

-- Data for regions
INSERT INTO regions (ogc_fid, wkb_geometry, shapename, shapeiso, shapeid, shapegroup, shapetype) VALUES
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

-- Data for cities
INSERT INTO cities (id, region_id, city_name, geom) VALUES
	(1, 26, 'Kyiv', NULL),
	(2, 20, 'Vinnytsia', NULL),
	(3, 2, 'Lutsk', NULL),
	(4, 24, 'Dnipro', NULL),
	(5, 10, 'Donetsk', NULL),
	(6, 4, 'Zhytomyr', NULL),
	(7, 14, 'Uzhhorod', NULL),
	(8, 11, 'Zaporizhzhia', NULL),
	(9, 13, 'Ivano-Frankivsk', NULL),
	(10, 25, 'Kropyvnytskyi', NULL),
	(11, 9, 'Luhansk', NULL),
	(12, 12, 'Lviv', NULL),
	(13, 18, 'Mykolaiv', NULL),
	(14, 17, 'Odesa', NULL),
	(15, 23, 'Poltava', NULL),
	(16, 3, 'Rivne', NULL),
	(17, 7, 'Sumy', NULL),
	(18, 15, 'Ternopil', NULL),
	(19, 8, 'Kharkiv', NULL),
	(20, 1, 'Kherson', NULL),
	(21, 21, 'Khmelnytskyi', NULL),
	(22, 22, 'Cherkasy', NULL),
	(23, 16, 'Chernivtsi', NULL),
	(24, 6, 'Chernihiv', NULL),
	(25, 27, 'Sevastopol', NULL),
	(26, 19, 'Simferopol', NULL),
	(27, 10, 'Kramatorsk', NULL);
