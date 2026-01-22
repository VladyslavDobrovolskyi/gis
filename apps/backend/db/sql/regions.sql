/* @name GetAllRegions */
SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type
FROM regions;

/* @name GetRegionById */
SELECT ogc_fid, ST_AsGeoJSON(geom) AS geom, name, iso_code, shape_id, group_code, type
FROM regions
WHERE ogc_fid = :ogc_fid;



