-- Crear tabla para registrar giros de ruleta por usuario
CREATE TABLE IF NOT EXISTS `giros_ruleta` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_nickname` VARCHAR(255) NOT NULL,
  `fecha_giro` DATE NOT NULL,
  `hora_giro` TIME NOT NULL,
  `elemento_ganado_id` INT NULL,
  `elemento_ganado_nombre` VARCHAR(255) NULL,
  `tipo_elemento` ENUM('comodin', 'puntos', 'personalizado') NULL,
  `puntos_ganados` INT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_fecha` (`usuario_nickname`, `fecha_giro`),
  INDEX `idx_usuario_fecha` (`usuario_nickname`, `fecha_giro`),
  FOREIGN KEY (`elemento_ganado_id`) REFERENCES `ruleta` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 