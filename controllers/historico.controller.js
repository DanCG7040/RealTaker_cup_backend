import connection from '../db.js';

// Función para crear histórico de una tabla general
export const crearHistoricoTablaGeneral = async (idEdicion, motivo = 'Nueva edición creada') => {
  try {
    console.log(`📊 Creando histórico para edición ${idEdicion}...`);
    
    // Verificar si ya existe histórico para esta edición
    const [existingHistorico] = await connection.query(
      'SELECT id FROM ediciones_historicas WHERE idEdicion = ?',
      [idEdicion]
    );
    
    if (existingHistorico.length > 0) {
      console.log(`⚠️ Ya existe histórico para la edición ${idEdicion}`);
      return false;
    }
    
    // Obtener datos de la tabla general actual
    const [tablaGeneral] = await connection.query(
      'SELECT * FROM tabla_general WHERE idEdicion = ?',
      [idEdicion]
    );
    
    if (tablaGeneral.length === 0) {
      console.log(`⚠️ No hay datos en tabla general para la edición ${idEdicion}`);
      return false;
    }
    
    // Iniciar transacción
    await connection.query('START TRANSACTION');
    
    try {
      // Insertar en ediciones_historicas
      await connection.query(
        'INSERT INTO ediciones_historicas (idEdicion, motivo) VALUES (?, ?)',
        [idEdicion, motivo]
      );
      
      // Copiar datos a historico_tabla_general
      for (const registro of tablaGeneral) {
        await connection.query(`
          INSERT INTO historico_tabla_general 
          (idEdicion, jugador_nickname, puntos_totales, partidas_jugadas, partidas_ganadas)
          VALUES (?, ?, ?, ?, ?)
        `, [
          registro.idEdicion,
          registro.jugador_nickname,
          registro.puntos_totales,
          registro.partidas_jugadas,
          registro.partidas_ganadas
        ]);
      }
      
      await connection.query('COMMIT');
      console.log(`✅ Histórico creado para edición ${idEdicion} con ${tablaGeneral.length} registros`);
      return true;
      
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error al crear histórico:', error);
    return false;
  }
};

// Obtener todas las ediciones históricas (público)
export const getEdicionesHistoricas = async (req, res) => {
  try {
    // Implementar rate limiting básico para prevenir abuso
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`📊 Acceso público al histórico desde IP: ${clientIP}`);
    
    const [ediciones] = await connection.query(`
      SELECT 
        eh.idEdicion,
        eh.fecha_historico,
        eh.motivo,
        e.fecha_inicio,
        e.fecha_fin,
        COUNT(htg.id) as total_jugadores
      FROM ediciones_historicas eh
      LEFT JOIN edicion e ON eh.idEdicion = e.idEdicion
      LEFT JOIN historico_tabla_general htg ON eh.idEdicion = htg.idEdicion
      GROUP BY eh.idEdicion, eh.fecha_historico, eh.motivo, e.fecha_inicio, e.fecha_fin
      ORDER BY eh.fecha_historico DESC
    `);
    
    res.json({
      success: true,
      data: ediciones,
      message: 'Ediciones históricas obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener ediciones históricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener tabla general histórica por edición (público)
export const getTablaGeneralHistorica = async (req, res) => {
  try {
    const { idEdicion } = req.params;
    
    if (!idEdicion || isNaN(idEdicion)) {
      return res.status(400).json({
        success: false,
        message: 'ID de edición inválido'
      });
    }
    
    // Implementar rate limiting básico para prevenir abuso
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`📊 Acceso público a tabla histórica ${idEdicion} desde IP: ${clientIP}`);
    
    // Verificar que existe histórico para esta edición
    const [edicionHistorica] = await connection.query(
      'SELECT * FROM ediciones_historicas WHERE idEdicion = ?',
      [idEdicion]
    );
    
    if (edicionHistorica.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró histórico para esta edición'
      });
    }
    
    // Obtener tabla general histórica (limitando información sensible)
    const [tablaHistorica] = await connection.query(`
      SELECT 
        htg.jugador_nickname,
        htg.puntos_totales,
        htg.partidas_jugadas,
        htg.partidas_ganadas,
        htg.fecha_historico
      FROM historico_tabla_general htg
      WHERE htg.idEdicion = ?
      ORDER BY htg.puntos_totales DESC, htg.partidas_ganadas DESC
    `, [idEdicion]);
    
    // Obtener información básica de la edición (sin datos sensibles)
    const [edicion] = await connection.query(`
      SELECT 
        idEdicion,
        fecha_inicio,
        fecha_fin
      FROM edicion 
      WHERE idEdicion = ?
    `, [idEdicion]);
    
    res.json({
      success: true,
      data: {
        edicion: edicion[0] || null,
        fecha_historico: edicionHistorica[0].fecha_historico,
        motivo: edicionHistorica[0].motivo,
        tabla_general: tablaHistorica
      },
      message: 'Tabla general histórica obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener tabla general histórica:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Función para crear histórico automáticamente cuando se crea una nueva edición
export const crearHistoricoAutomatico = async (nuevaEdicionId) => {
  try {
    // Obtener la edición anterior (la que tenía el ID más alto antes de la nueva)
    const [edicionesAnteriores] = await connection.query(`
      SELECT idEdicion FROM edicion 
      WHERE idEdicion < ? 
      ORDER BY idEdicion DESC 
      LIMIT 1
    `, [nuevaEdicionId]);
    
    if (edicionesAnteriores.length > 0) {
      const edicionAnterior = edicionesAnteriores[0].idEdicion;
      const motivo = `Nueva edición ${nuevaEdicionId} creada`;
      
      // Crear histórico de la edición anterior
      await crearHistoricoTablaGeneral(edicionAnterior, motivo);
    }
  } catch (error) {
    console.error('Error al crear histórico automático:', error);
  }
}; 