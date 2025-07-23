import connection from '../db.js';

// Obtener jugadores del torneo activo
export const getJugadoresTorneo = async (req, res) => {
  try {
    // Verificar si la tabla torneos existe
    try {
      await connection.query('SELECT 1 FROM torneos LIMIT 1');
    } catch (error) {
      // Si la tabla no existe, crear un torneo por defecto
      await connection.query(`
        CREATE TABLE IF NOT EXISTS torneos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          estado ENUM('active', 'inactive') DEFAULT 'inactive',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      
      // Crear un torneo por defecto
      await connection.query(`
        INSERT INTO torneos (nombre, estado) VALUES ('Torneo por defecto', 'active')
      `);
    }

    // Obtener el torneo activo
    const [torneoActivo] = await connection.query(
      'SELECT id FROM torneos WHERE estado = "active" ORDER BY id DESC LIMIT 1'
    );

    if (torneoActivo.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Verificar si la tabla torneo_jugadores existe
    try {
      await connection.query('SELECT 1 FROM torneo_jugadores LIMIT 1');
    } catch (error) {
      // Si la tabla no existe, crearla
      await connection.query(`
        CREATE TABLE IF NOT EXISTS torneo_jugadores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          torneo_id INT NOT NULL,
          usuario_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (torneo_id) REFERENCES torneos(id) ON DELETE CASCADE,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    // Obtener jugadores del torneo activo
    const [jugadores] = await connection.query(
      `SELECT DISTINCT u.id, u.nickname, u.email, u.foto, u.descripcion
       FROM usuarios u
       JOIN torneo_jugadores tj ON u.id = tj.usuario_id
       WHERE tj.torneo_id = ?
       ORDER BY u.nickname ASC`,
      [torneoActivo[0].id]
    );

    res.json({
      success: true,
      data: jugadores
    });
  } catch (error) {
    console.error('Error al obtener jugadores del torneo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener jugadores configurados para mostrar en el inicio
export const getJugadoresInicio = async (req, res) => {
  try {
    // Verificar si la tabla jugadores_inicio existe
    try {
      await connection.query('SELECT 1 FROM jugadores_inicio LIMIT 1');
    } catch (error) {
      // Si la tabla no existe, crearla
      await connection.query(`
        CREATE TABLE IF NOT EXISTS jugadores_inicio (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nickname VARCHAR(50) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    // Obtener jugadores configurados para el inicio
    const [jugadores] = await connection.query(
      `SELECT ji.nickname, u.foto, u.descripcion
       FROM jugadores_inicio ji
       LEFT JOIN usuarios u ON ji.nickname = u.nickname
       ORDER BY ji.created_at ASC`
    );

    res.json({
      success: true,
      data: jugadores
    });
  } catch (error) {
    console.error('Error al obtener jugadores del inicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Configurar jugadores para mostrar en el inicio
export const setJugadoresInicio = async (req, res) => {
  try {
    const { jugadores } = req.body;

    if (!Array.isArray(jugadores)) {
      return res.status(400).json({
        success: false,
        error: 'El campo jugadores debe ser un array'
      });
    }

    // Verificar si la tabla jugadores_inicio existe
    try {
      await connection.query('SELECT 1 FROM jugadores_inicio LIMIT 1');
    } catch (error) {
      // Si la tabla no existe, crearla
      await connection.query(`
        CREATE TABLE IF NOT EXISTS jugadores_inicio (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nickname VARCHAR(50) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    // Limpiar la tabla actual
    await connection.query('DELETE FROM jugadores_inicio');

    // Insertar los nuevos jugadores
    if (jugadores.length > 0) {
      const values = jugadores.map(nickname => [nickname]);
      await connection.query(
        'INSERT INTO jugadores_inicio (nickname) VALUES ?',
        [values]
      );
    }

    res.json({
      success: true,
      message: 'Jugadores del inicio actualizados correctamente'
    });
  } catch (error) {
    console.error('Error al configurar jugadores del inicio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}; 