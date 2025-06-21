-- Agregar campo texto_personalizado a la tabla ruleta
ALTER TABLE `ruleta` 
ADD COLUMN `texto_personalizado` TEXT NULL AFTER `comodin_id`;

-- Actualizar elementos existentes de puntos para que tengan texto_personalizado
UPDATE `ruleta` 
SET `texto_personalizado` = CASE 
    WHEN `tipo` = 'puntos' AND `nombre` LIKE '%+%' THEN 
        CONCAT('+', SUBSTRING_INDEX(SUBSTRING_INDEX(`nombre`, '+', -1), ' ', 1))
    WHEN `tipo` = 'puntos' AND `nombre` LIKE '%-%' THEN 
        CONCAT('-', SUBSTRING_INDEX(SUBSTRING_INDEX(`nombre`, '-', -1), ' ', 1))
    ELSE NULL
END
WHERE `tipo` = 'puntos'; 