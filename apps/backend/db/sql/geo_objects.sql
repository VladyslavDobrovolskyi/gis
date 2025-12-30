/* @name GetAllCitiesWithGeom */
SELECT o.id, o.name, c.population,
	ST_AsText(p.geom) AS geometry,
	ST_AsText(mp.geom) AS border_geometry
FROM geo_object o
JOIN city c ON c.geo_object_id = o.id
LEFT JOIN geo_point p ON p.geo_object_id = o.id
LEFT JOIN geo_multipolygon mp ON mp.geo_object_id = o.id
WHERE o.type_id = (SELECT id FROM geo_object_type WHERE code = 'CITY');

/* @name GetAllCountriesWithGeom */
SELECT o.id, o.name, co.iso_code, ST_AsText(mp.geom) AS geometry
FROM geo_object o
JOIN country co ON co.geo_object_id = o.id
LEFT JOIN geo_multipolygon mp ON mp.geo_object_id = o.id
WHERE o.type_id = (SELECT id FROM geo_object_type WHERE code = 'COUNTRY');