/* @name GetAllCountries */
SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type
FROM countries;

/* @name GetCountryById */
SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type
FROM countries
WHERE ogc_fid = :ogc_fid;
