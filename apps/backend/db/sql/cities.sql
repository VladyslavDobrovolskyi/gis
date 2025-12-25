/* @name GetAllCities */
SELECT id, name, population, ST_AsText(location) AS geometry FROM cities;