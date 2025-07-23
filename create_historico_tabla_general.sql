-- Crear tabla para el histórico de tablas generales
CREATE TABLE IF NOT EXISTS historico_tabla_general (
    id INT NOT NULL AUTO_INCREMENT,
    idEdicion INT NOT NULL,
    jugador_nickname VARCHAR(50) NOT NULL,
    puntos_totales INT DEFAULT 0,
    partidas_jugadas INT DEFAULT 0,
    partidas_ganadas INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_historico TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_edicion (idEdicion),
    INDEX idx_jugador (jugador_nickname),
    INDEX idx_fecha_historico (fecha_historico),
    FOREIGN KEY (idEdicion) REFERENCES edicion(idEdicion) ON DELETE CASCADE,
    FOREIGN KEY (jugador_nickname) REFERENCES usuarios(nickname) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Crear tabla para registrar cuando se hace histórico de una edición
CREATE TABLE IF NOT EXISTS ediciones_historicas (
    id INT NOT NULL AUTO_INCREMENT,
    idEdicion INT NOT NULL,
    fecha_historico TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(255) DEFAULT 'Nueva edición creada',
    PRIMARY KEY (id),
    UNIQUE KEY unique_edicion (idEdicion),
    FOREIGN KEY (idEdicion) REFERENCES edicion(idEdicion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 