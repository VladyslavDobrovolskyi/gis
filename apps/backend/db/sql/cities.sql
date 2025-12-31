/* @name GetAllCities */
SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom
FROM cities;

/* @name GetCityById */
SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom
FROM cities
WHERE ogc_fid = :ogc_fid;

/* @name GetCitiesByRegion */
SELECT ogc_fid, region_id, city_name, ST_AsGeoJSON(geom) AS geom
FROM cities
WHERE region_id = :region_id;


