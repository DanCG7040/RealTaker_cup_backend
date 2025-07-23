-- Crear tabla ruleta
CREATE TABLE IF NOT EXISTS ruleta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo ENUM('comodin', 'puntos', 'personalizado') NOT NULL DEFAULT 'personalizado',
  comodin_id INT NULL,
  texto_personalizado TEXT NULL,
  imagen_url VARCHAR(500) NULL,
  probabilidad DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  orden INT NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (comodin_id) REFERENCES comodines(idcomodines) ON DELETE SET NULL
);

-- Crear tabla configuracion_ruleta
CREATE TABLE IF NOT EXISTS configuracion_ruleta (
  id INT PRIMARY KEY DEFAULT 1,
  ruleta_activa BOOLEAN NOT NULL DEFAULT FALSE,
  max_giros_por_dia INT NOT NULL DEFAULT 3,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto
INSERT INTO configuracion_ruleta (id, ruleta_activa, max_giros_por_dia) 
VALUES (1, TRUE, 3)
ON DUPLICATE KEY UPDATE 
  ruleta_activa = VALUES(ruleta_activa),
  max_giros_por_dia = VALUES(max_giros_por_dia);

-- Insertar elementos de ejemplo
INSERT INTO ruleta (nombre, descripcion, tipo, comodin_id, texto_personalizado, probabilidad, activo, orden) VALUES
('Comodín Especial', 'Un comodín especial para usar en partidas', 'comodin', 1, NULL, 15.00, TRUE, 1),
('+10 Puntos', 'Gana 10 puntos para la tabla general', 'puntos', NULL, '+10', 25.00, TRUE, 2),
('+5 Puntos', 'Gana 5 puntos para la tabla general', 'puntos', NULL, '+5', 30.00, TRUE, 3),
('-5 Puntos', 'Pierde 5 puntos de la tabla general', 'puntos', NULL, '-5', 10.00, TRUE, 4),
('¡Mejor Suerte!', 'No ganas nada esta vez, pero no te rindas', 'personalizado', NULL, '¡Mejor suerte la próxima vez!', 20.00, TRUE, 5)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion),
  tipo = VALUES(tipo),
  comodin_id = VALUES(comodin_id),
  texto_personalizado = VALUES(texto_personalizado),
  probabilidad = VALUES(probabilidad),
  activo = VALUES(activo),
  orden = VALUES(orden); 