import connection from '../db.js';

// Obtener la última edición creada (en lugar de ediciones activas)
const getEdicionesActivas = async (req, res) => {
  try {
    const query = `
      SELECT idEdicion, fecha_inicio, fecha_fin 
      FROM edicion 
      ORDER BY idEdicion DESC
      LIMIT 1
    `;
    
    const [rows] = await connection.execute(query);
    
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
    
    const [rows] = await connection.execute(query, [idEdicion]);
    
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
    
    const [rows] = await connection.execute(query, [nickname]);
    
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
    const [edicionRows] = await connection.execute(edicionQuery, [torneo_id]);
    
    if (edicionRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La edición no existe'
      });
    }
    
    // Validar que el juego existe
    const juegoQuery = 'SELECT id FROM juegos WHERE id = ?';
    const [juegoRows] = await connection.execute(juegoQuery, [juego_id]);
    
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
    const [jugadoresRows] = await connection.execute(jugadoresQuery, [torneo_id, ...jugadores]);
    
    if (jugadoresRows.length !== jugadores.length) {
      return res.status(400).json({
        success: false,
        message: 'Algunos jugadores no están inscritos en esta edición'
      });
    }
    
    // Iniciar transacción
    await connection.query('START TRANSACTION');
    
    try {
      // Crear la partida
      const insertPartidaQuery = `
        INSERT INTO partidas (torneo_id, juego_id, fecha, tipo, fase, video_url) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [partidaResult] = await connection.execute(insertPartidaQuery, [
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
          await connection.execute(insertParticipantesQuery, [partidaId, jugador]);
        }
      }
      
      await connection.query('COMMIT');
      
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
      await connection.query('ROLLBACK');
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
    
    const [rows] = await connection.execute(query);
    
    // Para cada partida, obtener sus jugadores participantes y verificar si tiene resultados
    const partidasConJugadores = await Promise.all(rows.map(async (partida) => {
      const jugadoresQuery = `
        SELECT pp.jugador_nickname, u.foto, u.descripcion
        FROM participantes_partida pp
        INNER JOIN usuarios u ON pp.jugador_nickname = u.nickname
        WHERE pp.partida_id = ?
        ORDER BY u.nickname
      `;
      
      const [jugadoresRows] = await connection.execute(jugadoresQuery, [partida.id]);
      
      // Verificar si la partida tiene resultados
      const resultadosQuery = 'SELECT COUNT(*) as count FROM resultados_partidas WHERE partida_id = ?';
      const [resultadosRows] = await connection.execute(resultadosQuery, [partida.id]);
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
    
    const [rows] = await connection.execute(query, [id]);
    
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
    const [edicionRows] = await connection.execute(edicionQuery, [torneo_id]);
    
    if (edicionRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La edición no existe'
      });
    }
    
    // Validar que el juego existe
    const juegoQuery = 'SELECT id FROM juegos WHERE id = ?';
    const [juegoRows] = await connection.execute(juegoQuery, [juego_id]);
    
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
    const [jugadoresRows] = await connection.execute(jugadoresQuery, [torneo_id, ...jugadores]);
    
    if (jugadoresRows.length !== jugadores.length) {
      return res.status(400).json({
        success: false,
        message: 'Algunos jugadores no están inscritos en esta edición'
      });
    }
    
    // Verificar que la partida existe
    const partidaQuery = 'SELECT id FROM partidas WHERE id = ?';
    const [partidaRows] = await connection.execute(partidaQuery, [id]);
    
    if (partidaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partida no encontrada'
      });
    }
    
    // Iniciar transacción
    await connection.query('START TRANSACTION');
    
    try {
      // Actualizar la partida
      const updateQuery = `
        UPDATE partidas 
        SET torneo_id = ?, juego_id = ?, fecha = ?, tipo = ?, fase = ?, video_url = ?
        WHERE id = ?
      `;
      
      const [result] = await connection.execute(updateQuery, [
        torneo_id, juego_id, fecha, tipo, fase || 'Grupos', video_url || '', id
      ]);
      
      // Eliminar participantes actuales
      const deleteParticipantesQuery = 'DELETE FROM participantes_partida WHERE partida_id = ?';
      await connection.execute(deleteParticipantesQuery, [id]);
      
      // Insertar nuevos participantes
      if (jugadores.length > 0) {
        const insertParticipantesQuery = `
          INSERT INTO participantes_partida (partida_id, jugador_nickname) 
          VALUES (?, ?)
        `;
        
        for (const jugador of jugadores) {
          await connection.execute(insertParticipantesQuery, [id, jugador]);
        }
      }
      
      await connection.query('COMMIT');
      
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
      await connection.query('ROLLBACK');
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
    await connection.query('START TRANSACTION');
    
    try {
      // Eliminar resultados primero (por la foreign key)
      const deleteResultadosQuery = 'DELETE FROM resultados_partidas WHERE partida_id = ?';
      await connection.execute(deleteResultadosQuery, [id]);
      
      // Eliminar participantes (por la foreign key)
      const deleteParticipantesQuery = 'DELETE FROM participantes_partida WHERE partida_id = ?';
      await connection.execute(deleteParticipantesQuery, [id]);
      
      // Eliminar la partida
      const deletePartidaQuery = 'DELETE FROM partidas WHERE id = ?';
      const [result] = await connection.execute(deletePartidaQuery, [id]);
      
      if (result.affectedRows === 0) {
        await connection.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Partida no encontrada'
        });
      }
      
      await connection.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Partida eliminada exitosamente'
      });
    } catch (error) {
      await connection.query('ROLLBACK');
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
    const [partidaRows] = await connection.execute(partidaQuery, [id]);
    
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
    await connection.query('START TRANSACTION');
    
    try {
      // Eliminar resultados anteriores si existen
      const deleteResultadosQuery = 'DELETE FROM resultados_partidas WHERE partida_id = ?';
      await connection.execute(deleteResultadosQuery, [id]);
      
      // Obtener información del juego y categoría
      const juegoQuery = `
        SELECT j.*, c.nombre as categoria_nombre 
        FROM juegos j 
        INNER JOIN categoria c ON j.categoria_id = c.id 
        WHERE j.id = ?
      `;
      const [juegoRows] = await connection.execute(juegoQuery, [partida.juego_id]);
      const juego = juegoRows[0];
      
      // Insertar nuevos resultados con campos específicos por categoría
      const insertResultadoQuery = `
        INSERT INTO resultados_partidas (
          partida_id, jugador_nickname, posicion, gano, puntos,
          kills, muertes, goles, goles_recibidos, tiempo_carrera, 
          posicion_carrera, rondas_ganadas, rondas_perdidas, 
          nivel_alcanzado
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      for (const resultado of resultados) {
        await connection.execute(insertResultadoQuery, [
          id,
          resultado.jugador_nickname,
          resultado.posicion,
          resultado.gano ? 1 : 0,
          resultado.puntos || 0,
          resultado.kills || null,
          resultado.muertes || null,
          resultado.goles || null,
          resultado.goles_recibidos || null,
          resultado.tiempo_carrera || null,
          resultado.posicion_carrera || null,
          resultado.rondas_ganadas || null,
          resultado.rondas_perdidas || null,
          resultado.nivel_alcanzado || null
         
        ]);
      }
      
      // Si es fase de Grupos, actualizar la tabla general y estadísticas por categoría
      if (fase === 'Grupos') {
        for (const resultado of resultados) {
          // Verificar si el jugador ya existe en la tabla general
          const checkTablaQuery = `
            SELECT id FROM tabla_general 
            WHERE idEdicion = ? AND jugador_nickname = ?
          `;
          const [tablaRows] = await connection.execute(checkTablaQuery, [partida.idEdicion, resultado.jugador_nickname]);
          
          if (tablaRows.length > 0) {
            // Actualizar registro existente
            const updateTablaQuery = `
              UPDATE tabla_general 
              SET puntos_totales = puntos_totales + ?, 
                  partidas_jugadas = partidas_jugadas + 1,
                  partidas_ganadas = partidas_ganadas + ?
              WHERE idEdicion = ? AND jugador_nickname = ?
            `;
            await connection.execute(updateTablaQuery, [
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
            await connection.execute(insertTablaQuery, [
              partida.idEdicion,
              resultado.jugador_nickname,
              resultado.puntos || 0,
              resultado.gano ? 1 : 0
            ]);
          }
          
          // Actualizar estadísticas por categoría
          await actualizarEstadisticasCategoria(resultado, juego, partida.idEdicion);
        }
      }
      
      // Si es fase Final, asignar logro de ganador de edición
      if (fase === 'Final') {
        const ganador = resultados.find(r => r.gano);
        if (ganador) {
          await asignarLogroGanadorEdicion(ganador.jugador_nickname, partida.idEdicion);
        }
      }
      
      await connection.query('COMMIT');
      
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
      await connection.query('ROLLBACK');
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
    
    const [rows] = await connection.execute(query, [id]);
    
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
    const deleteQuery = 'DELETE FROM tabla_general';
    await connection.execute(deleteQuery);
    
    res.json({
      success: true,
      message: 'Tabla general limpiada exitosamente'
    });
  } catch (error) {
    console.error('Error al limpiar tabla general:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener tabla general
const getTablaGeneral = async (req, res) => {
  try {
    console.log('🔍 Obteniendo tabla general...');
    
    // Obtener la edición activa más reciente
    const [edicionRows] = await connection.query(`
      SELECT idEdicion FROM edicion 
      ORDER BY idEdicion DESC 
      LIMIT 1
    `);
    
    console.log('📋 Ediciones activas encontradas:', edicionRows.length);
    
    if (edicionRows.length === 0) {
      console.log('⚠️ No hay edición activa');
      return res.json({
        success: true,
        data: [],
        message: 'No hay edición activa'
      });
    }
    
    const idEdicion = edicionRows[0].idEdicion;
    console.log('🎯 Edición activa ID:', idEdicion);
    
    // Obtener tabla general ordenada por puntos
    const [tablaRows] = await connection.query(`
      SELECT 
        tg.jugador_nickname,
        tg.puntos_totales,
        tg.partidas_jugadas,
        tg.partidas_ganadas,
        u.foto,
        u.descripcion
      FROM tabla_general tg
      LEFT JOIN usuarios u ON tg.jugador_nickname = u.nickname
      WHERE tg.idEdicion = ?
      ORDER BY tg.puntos_totales DESC, tg.partidas_ganadas DESC
    `, [idEdicion]);
    
    console.log('📊 Registros en tabla general:', tablaRows.length);
    
    res.json({
      success: true,
      data: tablaRows,
      message: 'Tabla general obtenida exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al obtener tabla general:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener jugadores destacados con mejor rendimiento histórico
const getJugadoresDestacados = async (req, res) => {
  try {
    console.log('🏆 Obteniendo jugadores destacados...');
    
    // Obtener jugadores con mejor rendimiento histórico
    const [jugadoresDestacados] = await connection.query(`
      SELECT 
        u.nickname,
        u.foto,
        u.descripcion,
        COUNT(DISTINCT tp.idEdicion) as ediciones_participadas,
        SUM(tg.partidas_ganadas) as total_victorias,
        SUM(tg.partidas_jugadas) as total_partidas,
        SUM(tg.puntos_totales) as total_puntos,
        ROUND(
          (SUM(tg.partidas_ganadas) / NULLIF(SUM(tg.partidas_jugadas), 0)) * 100, 2
        ) as porcentaje_victorias
      FROM usuarios u
      LEFT JOIN torneo_participantes tp ON u.nickname = tp.jugador_nickname
      LEFT JOIN tabla_general tg ON u.nickname = tg.jugador_nickname
      WHERE u.rol = 2
      GROUP BY u.nickname, u.foto, u.descripcion
      HAVING total_partidas > 0
      ORDER BY 
        total_victorias DESC,
        porcentaje_victorias DESC,
        total_puntos DESC,
        ediciones_participadas DESC
      LIMIT 4
    `);
    
    console.log('📊 Jugadores destacados encontrados:', jugadoresDestacados.length);
    
    res.json({
      success: true,
      data: jugadoresDestacados,
      message: 'Jugadores destacados obtenidos exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al obtener jugadores destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas reales del torneo
const getEstadisticasReales = async (req, res) => {
  try {
    // Obtener la edición actual (la más reciente)
    const edicionQuery = `
      SELECT idEdicion, fecha_inicio, fecha_fin 
      FROM edicion 
      ORDER BY idEdicion DESC 
      LIMIT 1
    `;
    const [ediciones] = await connection.execute(edicionQuery);
    
    if (ediciones.length === 0) {
      return res.json({
        success: true,
        data: {
          totalPartidas: 0,
          partidasJugadas: 0,
          partidasPendientes: 0,
          jugadoresActivos: 0,
          progresoTorneo: 0,
          edicionActual: null
        }
      });
    }
    
    const edicionActual = ediciones[0];
    
    // Total de partidas en la edición actual
    const totalPartidasQuery = `
      SELECT COUNT(*) as total 
      FROM partidas 
      WHERE torneo_id = ?
    `;
    const [totalPartidas] = await connection.execute(totalPartidasQuery, [edicionActual.idEdicion]);
    
    // Partidas jugadas (con resultados)
    const partidasJugadasQuery = `
      SELECT COUNT(DISTINCT p.id) as jugadas
      FROM partidas p
      INNER JOIN resultados_partidas rp ON p.id = rp.partida_id
      WHERE p.torneo_id = ?
    `;
    const [partidasJugadas] = await connection.execute(partidasJugadasQuery, [edicionActual.idEdicion]);
    
    // Jugadores activos en la edición
    const jugadoresActivosQuery = `
      SELECT COUNT(DISTINCT tp.jugador_nickname) as activos
      FROM torneo_participantes tp
      WHERE tp.idEdicion = ?
    `;
    const [jugadoresActivos] = await connection.execute(jugadoresActivosQuery, [edicionActual.idEdicion]);
    
    // Calcular progreso del torneo
    const totalPartidasCount = totalPartidas[0].total;
    const partidasJugadasCount = partidasJugadas[0].jugadas;
    const progresoTorneo = totalPartidasCount > 0 ? Math.round((partidasJugadasCount / totalPartidasCount) * 100) : 0;
    
    // Fechas de la edición
    const fechaInicio = new Date(edicionActual.fecha_inicio);
    const fechaFin = new Date(edicionActual.fecha_fin);
    const fechaActual = new Date();
    
    // Calcular progreso temporal
    const tiempoTotal = fechaFin.getTime() - fechaInicio.getTime();
    const tiempoTranscurrido = fechaActual.getTime() - fechaInicio.getTime();
    const progresoTemporal = Math.min(Math.max((tiempoTranscurrido / tiempoTotal) * 100, 0), 100);
    
    res.json({
      success: true,
      data: {
        totalPartidas: totalPartidasCount,
        partidasJugadas: partidasJugadasCount,
        partidasPendientes: totalPartidasCount - partidasJugadasCount,
        jugadoresActivos: jugadoresActivos[0].activos,
        progresoTorneo,
        progresoTemporal: Math.round(progresoTemporal),
        edicionActual: {
          id: edicionActual.idEdicion,
          fechaInicio: edicionActual.fecha_inicio,
          fechaFin: edicionActual.fecha_fin
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Función auxiliar para actualizar estadísticas por categoría
const actualizarEstadisticasCategoria = async (resultado, juego, idEdicion) => {
  try {
    // Verificar si existe registro de estadísticas para este jugador y categoría
    const checkEstadisticasQuery = `
      SELECT id FROM estadisticas_jugador 
      WHERE jugador_nickname = ? AND categoria_id = ? AND idEdicion = ?
    `;
    const [estadisticasRows] = await connection.execute(checkEstadisticasQuery, [
      resultado.jugador_nickname, 
      juego.categoria_id, 
      idEdicion
    ]);
    
    const categoriaNombre = juego.categoria_nombre;
    let updateQuery = '';
    let updateParams = [];
    
    if (estadisticasRows.length > 0) {
      // Actualizar registro existente
      updateQuery = `
        UPDATE estadisticas_jugador 
        SET partidas_jugadas = partidas_jugadas + 1,
            partidas_ganadas = partidas_ganadas + ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
      `;
      updateParams = [resultado.gano ? 1 : 0];
      
      // Agregar campos específicos según la categoría
      switch (categoriaNombre) {
        case 'shooters':
          updateQuery += `, total_kills = total_kills + ?, total_muertes = total_muertes + ?`;
          updateParams.push(resultado.kills || 0, resultado.muertes || 0);
          break;
        case 'deportes':
          updateQuery += `, total_goles = total_goles + ?, total_goles_recibidos = total_goles_recibidos + ?`;
          updateParams.push(resultado.goles || 0, resultado.goles_recibidos || 0);
          break;
        case 'carreras':
          if (resultado.tiempo_carrera) {
            updateQuery += `, mejor_tiempo_carrera = CASE 
              WHEN mejor_tiempo_carrera IS NULL OR ? < mejor_tiempo_carrera 
              THEN ? ELSE mejor_tiempo_carrera END`;
            updateParams.push(resultado.tiempo_carrera, resultado.tiempo_carrera);
          }
          break;
        case 'luchas':
          updateQuery += `, total_rondas_ganadas = total_rondas_ganadas + ?, total_rondas_perdidas = total_rondas_perdidas + ?`;
          updateParams.push(resultado.rondas_ganadas || 0, resultado.rondas_perdidas || 0);
          break;
        case 'plataformas':
          updateQuery += `, maximo_nivel_alcanzado = GREATEST(maximo_nivel_alcanzado, ?)`;
          updateParams.push(resultado.nivel_alcanzado || 0);
          break;
      }
      
      updateQuery += ` WHERE jugador_nickname = ? AND categoria_id = ? AND idEdicion = ?`;
      updateParams.push(resultado.jugador_nickname, juego.categoria_id, idEdicion);
      
      await connection.execute(updateQuery, updateParams);
    } else {
      // Crear nuevo registro
      const insertQuery = `
        INSERT INTO estadisticas_jugador (
          jugador_nickname, categoria_id, idEdicion, partidas_jugadas, partidas_ganadas,
          total_kills, total_muertes, total_goles, total_goles_recibidos, 
          mejor_tiempo_carrera, total_rondas_ganadas, total_rondas_perdidas,
          maximo_nivel_alcanzado
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [
        resultado.jugador_nickname, 
        juego.categoria_id, 
        idEdicion,
        resultado.gano ? 1 : 0,
        categoriaNombre === 'shooters' ? (resultado.kills || 0) : 0,
        categoriaNombre === 'shooters' ? (resultado.muertes || 0) : 0,
        categoriaNombre === 'deportes' ? (resultado.goles || 0) : 0,
        categoriaNombre === 'deportes' ? (resultado.goles_recibidos || 0) : 0,
        categoriaNombre === 'carreras' ? (resultado.tiempo_carrera || null) : null,
        categoriaNombre === 'luchas' ? (resultado.rondas_ganadas || 0) : 0,
        categoriaNombre === 'luchas' ? (resultado.rondas_perdidas || 0) : 0,
        categoriaNombre === 'plataformas' ? (resultado.nivel_alcanzado || 0) : 0
      ];
      
      await connection.execute(insertQuery, insertParams);
    }
  } catch (error) {
    console.error('Error al actualizar estadísticas por categoría:', error);
    throw error;
  }
};

// Función auxiliar para asignar logro de ganador de edición
const asignarLogroGanadorEdicion = async (nickname, idEdicion) => {
  try {
    console.log(`🏆 Asignando logro de ganador de edición ${idEdicion} a ${nickname}`);
    
    // Obtener información de la edición
    const [edicionRows] = await connection.execute(`
      SELECT idEdicion FROM edicion WHERE idEdicion = ?
    `, [idEdicion]);
    
    if (edicionRows.length === 0) {
      console.error('❌ Edición no encontrada:', idEdicion);
      return;
    }
    
    // Crear o verificar si existe el logro de ganador de edición
    const logroNombre = `Ganador Real TakerCup ${idEdicion}`;
    const logroDescripcion = `Campeón de la edición ${idEdicion} de la Real TakerCup`;
    
    // Verificar si el logro ya existe
    const [logroRows] = await connection.execute(`
      SELECT idlogros FROM logros WHERE nombre = ?
    `, [logroNombre]);
    
    let logroId;
    if (logroRows.length === 0) {
      // Crear el logro
      const [logroResult] = await connection.execute(`
        INSERT INTO logros (nombre, descripcion) VALUES (?, ?)
      `, [logroNombre, logroDescripcion]);
      logroId = logroResult.insertId;
      console.log('✅ Logro creado:', logroId);
    } else {
      logroId = logroRows[0].idlogros;
    }
    
    // Verificar si el jugador ya tiene este logro
    const [logroUsuarioRows] = await connection.execute(`
      SELECT id FROM usuario_logros WHERE usuario_nickname = ? AND logro_id = ?
    `, [nickname, logroId]);
    
    if (logroUsuarioRows.length === 0) {
      // Asignar el logro al jugador
      await connection.execute(`
        INSERT INTO usuario_logros (usuario_nickname, logro_id, asignado_por) 
        VALUES (?, ?, 'Sistema')
      `, [nickname, logroId]);
      console.log('✅ Logro asignado a:', nickname);
    } else {
      console.log('ℹ️ El jugador ya tiene este logro');
    }
    
  } catch (error) {
    console.error('❌ Error al asignar logro de ganador:', error);
  }
};

// Obtener estadísticas detalladas por jugador y categoría
const getEstadisticasDetalladas = async (req, res) => {
  try {
    const { nickname } = req.params;
    const { idEdicion } = req.query;
    
    console.log('🔍 Obteniendo estadísticas para:', nickname);
    console.log('📋 Parámetros:', { nickname, idEdicion });
    
    if (!nickname || nickname === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Nickname es requerido y debe ser válido'
      });
    }
    
    // Verificar que el usuario existe
    const userQuery = 'SELECT nickname FROM usuarios WHERE nickname = ?';
    const [userRows] = await connection.execute(userQuery, [nickname]);
    
    if (userRows.length === 0) {
      console.log('❌ Usuario no encontrado:', nickname);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Obtener la edición actual si no se especifica
    let edicionActual = idEdicion;
    if (!edicionActual) {
      const edicionQuery = `
        SELECT idEdicion FROM edicion 
        ORDER BY idEdicion DESC 
        LIMIT 1
      `;
      const [edicionRows] = await connection.execute(edicionQuery);
      if (edicionRows.length > 0) {
        edicionActual = edicionRows[0].idEdicion;
      }
    }
    
    console.log('🎯 Edición actual:', edicionActual);
    
    // Construir la consulta base
    let query = `
      SELECT 
        ej.jugador_nickname,
        ej.categoria_id,
        c.nombre as categoria_nombre,
        ej.partidas_jugadas,
        ej.partidas_ganadas,
        ej.total_kills,
        ej.total_muertes,
        ej.total_goles,
        ej.total_goles_recibidos,
        ej.mejor_tiempo_carrera,
        ej.total_rondas_ganadas,
        ej.total_rondas_perdidas,
        ej.maximo_nivel_alcanzado,
        ej.fecha_actualizacion
      FROM estadisticas_jugador ej
      INNER JOIN categoria c ON ej.categoria_id = c.id
      WHERE ej.jugador_nickname = ?
    `;
    
    const queryParams = [nickname];
    
    if (edicionActual) {
      query += ' AND ej.idEdicion = ?';
      queryParams.push(edicionActual);
    }
    
    query += ' ORDER BY c.nombre';
    
    console.log('📊 Query:', query);
    console.log('🔢 Parámetros:', queryParams);
    
    const [rows] = await connection.execute(query, queryParams);
    
    console.log('📈 Estadísticas encontradas:', rows.length);
    
    // Calcular estadísticas adicionales
    const estadisticasConCalculos = rows.map(stat => {
      const estadistica = { ...stat };
      
      // Calcular porcentaje de victorias
      estadistica.porcentaje_victorias = stat.partidas_jugadas > 0 
        ? Math.round((stat.partidas_ganadas / stat.partidas_jugadas) * 100) 
        : 0;
      
      // Calcular K/D ratio para shooters
      if (stat.categoria_nombre === 'shooters' && stat.total_muertes > 0) {
        estadistica.kd_ratio = parseFloat((stat.total_kills / stat.total_muertes).toFixed(2));
      } else if (stat.categoria_nombre === 'shooters') {
        estadistica.kd_ratio = stat.total_kills;
      }
      
      // Calcular diferencia de goles para deportes
      if (stat.categoria_nombre === 'deportes') {
        estadistica.diferencia_goles = stat.total_goles - stat.total_goles_recibidos;
      }
      
      // Calcular porcentaje de rondas ganadas para luchas
      if (stat.categoria_nombre === 'luchas') {
        const totalRondas = stat.total_rondas_ganadas + stat.total_rondas_perdidas;
        estadistica.porcentaje_rondas_ganadas = totalRondas > 0 
          ? Math.round((stat.total_rondas_ganadas / totalRondas) * 100) 
          : 0;
      }
      
      return estadistica;
    });
    
    res.json({
      success: true,
      message: 'Estadísticas detalladas obtenidas exitosamente',
      data: {
        jugador: nickname,
        estadisticas: estadisticasConCalculos
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas detalladas:', error);
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
  getPerfilJugador,
  createPartida,
  getAllPartidas,
  getPartidaById,
  updatePartida,
  deletePartida,
  registrarResultado,
  getResultado,
  limpiarTablaGeneral,
  getTablaGeneral,
  getJugadoresDestacados,
  getEstadisticasReales,
  getEstadisticasDetalladas
}; 