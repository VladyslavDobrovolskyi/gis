/* @name getDistanceFromTo */
SELECT 
  c1.name AS city_from,
  c2.name AS city_to,
  ST_Distance(
    c1.location::geography,
    c2.location::geography
  ) AS distance_meters
FROM cities c1
CROSS JOIN cities c2
WHERE c1.name = :from AND c2.name = :to;