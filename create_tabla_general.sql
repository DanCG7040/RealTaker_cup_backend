-- Crear tabla tabla_general
CREATE TABLE IF NOT EXISTS tabla_general (
  id INT NOT NULL AUTO_INCREMENT,
  idEdicion INT NOT NULL,
  jugador_nickname VARCHAR(50) NOT NULL,
  puntos_totales INT DEFAULT 0,
  partidas_jugadas INT DEFAULT 0,
  partidas_ganadas INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_jugador_edicion (idEdicion, jugador_nickname),
  FOREIGN KEY (idEdicion) REFERENCES edicion(idEdicion) ON DELETE CASCADE,
  FOREIGN KEY (jugador_nickname) REFERENCES usuarios(nickname) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verificar si hay ediciones activas, si no, crear una
INSERT IGNORE INTO edicion (fecha_inicio, fecha_fin, activa) 
SELECT CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1
WHERE NOT EXISTS (SELECT 1 FROM edicion WHERE activa = 1);

-- Crear jugadores de ejemplo si no existen
INSERT IGNORE INTO usuarios (nickname, email, password, rol) VALUES
('Player1', 'player1@example.com', 'password123', 2),
('Player2', 'player2@example.com', 'password123', 2),
('Player3', 'player3@example.com', 'password123', 2),
('Player4', 'player4@example.com', 'password123', 2),
('Player5', 'player5@example.com', 'password123', 2);

-- Obtener la edición activa
SET @idEdicion = (SELECT idEdicion FROM edicion WHERE activa = 1 ORDER BY idEdicion DESC LIMIT 1);

-- Insertar datos de ejemplo en tabla_general
INSERT IGNORE INTO tabla_general (idEdicion, jugador_nickname, puntos_totales, partidas_jugadas, partidas_ganadas) VALUES
(@idEdicion, 'Player1', 150, 10, 8),
(@idEdicion, 'Player2', 120, 8, 6),
(@idEdicion, 'Player3', 95, 7, 5),
(@idEdicion, 'Player4', 80, 6, 4),
(@idEdicion, 'Player5', 65, 5, 3);

-- Mostrar la tabla general creada
SELECT 
  tg.jugador_nickname,
  tg.puntos_totales,
  tg.partidas_jugadas,
  tg.partidas_ganadas
FROM tabla_general tg
WHERE tg.idEdicion = @idEdicion
ORDER BY tg.puntos_totales DESC; 