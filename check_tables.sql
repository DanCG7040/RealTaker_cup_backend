-- Verificar estructura de la tabla logros
DESCRIBE logros;

-- Verificar estructura de la tabla comodines
DESCRIBE comodines;

-- Verificar datos en la tabla logros
SELECT * FROM logros LIMIT 5;

-- Verificar datos en la tabla comodines
SELECT * FROM comodines LIMIT 5;

-- Verificar si hay datos en las tablas
SELECT COUNT(*) as total_logros FROM logros;
SELECT COUNT(*) as total_comodines FROM comodines; 