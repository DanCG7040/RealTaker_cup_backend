import db from '../db.js';

// Obtener la última edición creada (en lugar de ediciones activas)
const getEdicionesActivas = async (req, res) => {
  try {
    const query = `
      SELECT idEdicion, fecha_inicio, fecha_fin 
      FROM edicion 
      ORDER BY idEdicion DESC
      LIMIT 1
    `;
    
    const [rows] = await db.execute(query);
    
    res.json({
      success: true,
      message: 'Última edición obtenida exitosamente',
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener la última edición:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener jugadores inscritos en una edición específica
const getJugadoresByEdicion = async (req, res) => {
  try {
    const { idEdicion } = req.params;
    
    if (!idEdicion || isNaN(idEdicion)) {
      return res.status(400).json({
        success: false,
        message: 'ID de edición inválido'
      });
    }
    
    const query = `
      SELECT u.nickname, u.foto, u.descripcion
      FROM usuarios u
      INNER JOIN torneo_participantes tp ON u.nickname = tp.jugador_nickname
      WHERE tp.idEdicion = ? AND u.rol = 2
      ORDER BY u.nickname
    `;
    
    const [rows] = await db.execute(query, [idEdicion]);
    
    res.json({
      success: true,
      message: 'Jugadores obtenidos exitosamente',
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener jugadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener perfil público de un jugador
const getPerfilJugador = async (req, res) => {
  try {
    const { nickname } = req.params;
    
    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: 'Nickname requerido'
      });
    }
    
    const query = `
      SELECT nickname, foto, descripcion
      FROM usuarios
      WHERE nickname = ? AND rol = 2
    `;
    
    const [rows] = await db.execute(query, [nickname]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nueva partida
const createPartida = async (req, res) => {
  try {
    const { torneo_id, juego_id, fecha, tipo, jugadores, fase, video_url } = req.body;
    
    // Validaciones
    if (!torneo_id || !juego_id || !fecha || !tipo || !jugadores || !Array.isArray(jugadores)) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos y jugadores debe ser un array'
      });
    }
    
    if (!['PVP', 'TodosContraTodos'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de partida inválido'
      });
    }
    
    // Validar que la edición existe
    const edicionQuery = `
      SELECT idEdicion FROM edicion 
      WHERE idEdicion = ?
    `;
    const [edicionRows] = await db.execute(edicionQuery, [torneo_id]);
    
    if (edicionRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La edición no existe'
      });
    }
    
    // Validar que el juego existe
    const juegoQuery = 'SELECT id FROM juegos WHERE id = ?';
    const [juegoRows] = await db.execute(juegoQuery, [juego_id]);
    
    if (juegoRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El juego no existe'
      });
    }
    
    // Validar que los jugadores están inscritos en la edición
    const jugadoresQuery = `
      SELECT jugador_nickname FROM torneo_participantes 
      WHERE idEdicion = ? AND jugador_nickname IN (${jugadores.map(() => '?').join(',')})
    `;
    const [jugadoresRows] = await db.execute(jugadoresQuery, [torneo_id, ...jugadores]);
    
    if (jugadoresRows.length !== jugadores.length) {
      return res.status(400).json({
        success: false,
        message: 'Algunos jugadores no están inscritos en esta edición'
      });
    }
    
    // Iniciar transacción
    await db.query('START TRANSACTION');
    
    try {
      // Crear la partida
      const insertPartidaQuery = `
        INSERT INTO partidas (torneo_id, juego_id, fecha, tipo, fase, video_url) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [partidaResult] = await db.execute(insertPartidaQuery, [
        torneo_id, juego_id, fecha, tipo, fase || 'Grupos', video_url || ''
      ]);
      
      const partidaId = partidaResult.insertId;
      
      // Insertar participantes en la tabla participantes_partida
      if (jugadores.length > 0) {
        const insertParticipantesQuery = `
          INSERT INTO participantes_partida (partida_id, jugador_nickname) 
          VALUES (?, ?)
        `;
        
        for (const jugador of jugadores) {
          await db.execute(insertParticipantesQuery, [partidaId, jugador]);
        }
      }
      
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Partida creada exitosamente',
        data: {
          id: partidaId,
          torneo_id,
          juego_id,
          fecha,
          tipo,
          jugadores,
          fase: fase || 'Grupos',
          video_url: video_url || ''
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al crear partida:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todas las partidas
const getAllPartidas = async (req, res) => {
  try {
    const query = `
      SELECT p.*, e.idEdicion, j.nombre as juego_nombre, j.foto as juego_foto
      FROM partidas p
      INNER JOIN edicion e ON p.torneo_id = e.idEdicion
      INNER JOIN juegos j ON p.juego_id = j.id
      ORDER BY p.fecha DESC
    `;
    
    const [rows] = await db.execute(query);
    
    // Para cada partida, obtener sus jugadores participantes y verificar si tiene resultados
    const partidasConJugadores = await Promise.all(rows.map(async (partida) => {
      const jugadoresQuery = `
        SELECT pp.jugador_nickname, u.foto, u.descripcion
        FROM participantes_partida pp
        INNER JOIN usuarios u ON pp.jugador_nickname = u.nickname
        WHERE pp.partida_id = ?
        ORDER BY u.nickname
      `;
      
      const [jugadoresRows] = await db.execute(jugadoresQuery, [partida.id]);
      
      // Verificar si la partida tiene resultados
      const resultadosQuery = 'SELECT COUNT(*) as count FROM resultados_partidas WHERE partida_id = ?';
      const [resultadosRows] = await db.execute(resultadosQuery, [partida.id]);
      const tieneResultado = resultadosRows[0].count > 0;
      
      return {
        ...partida,
        jugadores: jugadoresRows.map(j => j.jugador_nickname),
        jugadores_detalle: jugadoresRows,
        tiene_resultado: tieneResultado
      };
    }));
    
    res.json({
      success: true,
      message: 'Partidas obtenidas exitosamente',
      data: partidasConJugadores
    });
  } catch (error) {
    console.error('Error al obtener partidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener partida por ID
const getPartidaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partida inválido'
      });
    }
    
    const query = `
      SELECT p.*, e.idEdicion, j.nombre as juego_nombre, j.foto as juego_foto
      FROM partidas p
      INNER JOIN edicion e ON p.torneo_id = e.idEdicion
      INNER JOIN juegos j ON p.juego_id = j.id
      WHERE p.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partida no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Partida obtenida exitosamente',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error al obtener partida:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar partida
const updatePartida = async (req, res) => {
  try {
    const { id } = req.params;
    const { torneo_id, juego_id, fecha, tipo, jugadores, fase, video_url } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partida inválido'
      });
    }
    
    // Validaciones
    if (!torneo_id || !juego_id || !fecha || !tipo || !jugadores || !Array.isArray(jugadores)) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos y jugadores debe ser un array'
      });
    }
    
    if (!['PVP', 'TodosContraTodos'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de partida inválido'
      });
    }
    
    // Validar que la edición existe
    const edicionQuery = `
      SELECT idEdicion FROM edicion 
      WHERE idEdicion = ?
    `;
    const [edicionRows] = await db.execute(edicionQuery, [torneo_id]);
    
    if (edicionRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La edición no existe'
      });
    }
    
    // Validar que el juego existe
    const juegoQuery = 'SELECT id FROM juegos WHERE id = ?';
    const [juegoRows] = await db.execute(juegoQuery, [juego_id]);
    
    if (juegoRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El juego no existe'
      });
    }
    
    // Validar que los jugadores están inscritos en la edición
    const jugadoresQuery = `
      SELECT jugador_nickname FROM torneo_participantes 
      WHERE idEdicion = ? AND jugador_nickname IN (${jugadores.map(() => '?').join(',')})
    `;
    const [jugadoresRows] = await db.execute(jugadoresQuery, [torneo_id, ...jugadores]);
    
    if (jugadoresRows.length !== jugadores.length) {
      return res.status(400).json({
        success: false,
        message: 'Algunos jugadores no están inscritos en esta edición'
      });
    }
    
    // Verificar que la partida existe
    const partidaQuery = 'SELECT id FROM partidas WHERE id = ?';
    const [partidaRows] = await db.execute(partidaQuery, [id]);
    
    if (partidaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partida no encontrada'
      });
    }
    
    // Iniciar transacción
    await db.query('START TRANSACTION');
    
    try {
      // Actualizar la partida
      const updateQuery = `
        UPDATE partidas 
        SET torneo_id = ?, juego_id = ?, fecha = ?, tipo = ?, fase = ?, video_url = ?
        WHERE id = ?
      `;
      
      const [result] = await db.execute(updateQuery, [
        torneo_id, juego_id, fecha, tipo, fase || 'Grupos', video_url || '', id
      ]);
      
      // Eliminar participantes actuales
      const deleteParticipantesQuery = 'DELETE FROM participantes_partida WHERE partida_id = ?';
      await db.execute(deleteParticipantesQuery, [id]);
      
      // Insertar nuevos participantes
      if (jugadores.length > 0) {
        const insertParticipantesQuery = `
          INSERT INTO participantes_partida (partida_id, jugador_nickname) 
          VALUES (?, ?)
        `;
        
        for (const jugador of jugadores) {
          await db.execute(insertParticipantesQuery, [id, jugador]);
        }
      }
      
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Partida actualizada exitosamente',
        data: {
          id: parseInt(id),
          torneo_id,
          juego_id,
          fecha,
          tipo,
          jugadores,
          fase: fase || 'Grupos',
          video_url: video_url || ''
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar partida:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar partida
const deletePartida = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partida inválido'
      });
    }
    
    // Iniciar transacción
    await db.query('START TRANSACTION');
    
    try {
      // Eliminar resultados primero (por la foreign key)
      const deleteResultadosQuery = 'DELETE FROM resultados_partidas WHERE partida_id = ?';
      await db.execute(deleteResultadosQuery, [id]);
      
      // Eliminar participantes (por la foreign key)
      const deleteParticipantesQuery = 'DELETE FROM participantes_partida WHERE partida_id = ?';
      await db.execute(deleteParticipantesQuery, [id]);
      
      // Eliminar la partida
      const deletePartidaQuery = 'DELETE FROM partidas WHERE id = ?';
      const [result] = await db.execute(deletePartidaQuery, [id]);
      
      if (result.affectedRows === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Partida no encontrada'
        });
      }
      
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Partida eliminada exitosamente'
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al eliminar partida:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Registrar resultado de partida
const registrarResultado = async (req, res) => {
  try {
    const { id } = req.params;
    const { resultados, fase } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partida inválido'
      });
    }
    
    if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Los resultados son requeridos y deben ser un array'
      });
    }
    
    // Verificar que la partida existe
    const partidaQuery = `
      SELECT p.*, e.idEdicion 
      FROM partidas p 
      INNER JOIN edicion e ON p.torneo_id = e.idEdicion 
      WHERE p.id = ?
    `;
    const [partidaRows] = await db.execute(partidaQuery, [id]);
    
    if (partidaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partida no encontrada'
      });
    }
    
    const partida = partidaRows[0];
    
    // Validar que solo hay un ganador
    const ganadores = resultados.filter(r => r.gano);
    if (ganadores.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Debe haber exactamente un ganador'
      });
    }
    
    // Validar que las posiciones son únicas
    const posiciones = resultados.map(r => r.posicion);
    const posicionesUnicas = new Set(posiciones);
    if (posicionesUnicas.size !== posiciones.length) {
      return res.status(400).json({
        success: false,
        message: 'Las posiciones deben ser únicas'
      });
    }
    
    // Iniciar transacción
    await db.query('START TRANSACTION');
    
    try {
      // Eliminar resultados anteriores si existen
      const deleteResultadosQuery = 'DELETE FROM resultados_partidas WHERE partida_id = ?';
      await db.execute(deleteResultadosQuery, [id]);
      
      // Insertar nuevos resultados
      const insertResultadoQuery = `
        INSERT INTO resultados_partidas (partida_id, jugador_nickname, posicion, gano, puntos) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      for (const resultado of resultados) {
        await db.execute(insertResultadoQuery, [
          id,
          resultado.jugador_nickname,
          resultado.posicion,
          resultado.gano ? 1 : 0,
          resultado.puntos || 0
        ]);
      }
      
      // Si es fase de Grupos, actualizar la tabla general
      if (fase === 'Grupos') {
        for (const resultado of resultados) {
          // Verificar si el jugador ya existe en la tabla general
          const checkTablaQuery = `
            SELECT id FROM tabla_general 
            WHERE idEdicion = ? AND jugador_nickname = ?
          `;
          const [tablaRows] = await db.execute(checkTablaQuery, [partida.idEdicion, resultado.jugador_nickname]);
          
          if (tablaRows.length > 0) {
            // Actualizar registro existente
            const updateTablaQuery = `
              UPDATE tabla_general 
              SET puntos_totales = puntos_totales + ?, 
                  partidas_jugadas = partidas_jugadas + 1,
                  partidas_ganadas = partidas_ganadas + ?
              WHERE idEdicion = ? AND jugador_nickname = ?
            `;
            await db.execute(updateTablaQuery, [
              resultado.puntos || 0,
              resultado.gano ? 1 : 0,
              partida.idEdicion,
              resultado.jugador_nickname
            ]);
          } else {
            // Crear nuevo registro
            const insertTablaQuery = `
              INSERT INTO tabla_general (idEdicion, jugador_nickname, puntos_totales, partidas_jugadas, partidas_ganadas) 
              VALUES (?, ?, ?, 1, ?)
            `;
            await db.execute(insertTablaQuery, [
              partida.idEdicion,
              resultado.jugador_nickname,
              resultado.puntos || 0,
              resultado.gano ? 1 : 0
            ]);
          }
        }
      }
      
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Resultado registrado exitosamente',
        data: {
          partida_id: parseInt(id),
          resultados: resultados,
          fase: fase
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al registrar resultado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener resultado de partida
const getResultado = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de partida inválido'
      });
    }
    
    const query = `
      SELECT rp.*, u.foto, u.descripcion
      FROM resultados_partidas rp
      INNER JOIN usuarios u ON rp.jugador_nickname = u.nickname
      WHERE rp.partida_id = ?
      ORDER BY rp.posicion ASC
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron resultados para esta partida'
      });
    }
    
    res.json({
      success: true,
      message: 'Resultado obtenido exitosamente',
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener resultado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Limpiar tabla general
const limpiarTablaGeneral = async (req, res) => {
  try {
    // Iniciar transacción
    await db.query('START TRANSACTION');
    
    try {
      // Eliminar todos los registros de la tabla general
      const deleteQuery = 'DELETE FROM tabla_general';
      const [result] = await db.execute(deleteQuery);
      
      await db.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Tabla general limpiada exitosamente',
        data: {
          registrosEliminados: result.affectedRows
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al limpiar tabla general:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getEdicionesActivas,
  getJugadoresByEdicion,
  createPartida,
  getAllPartidas,
  getPartidaById,
  updatePartida,
  deletePartida,
  getPerfilJugador,
  registrarResultado,
  getResultado,
  limpiarTablaGeneral
}; 