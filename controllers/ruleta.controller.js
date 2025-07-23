import connection from '../db.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Obtener todos los elementos de la ruleta
export const getRuletaItems = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT r.*, 
             c.nombre as comodin_nombre, 
             c.foto as comodin_foto
      FROM ruleta r
      LEFT JOIN comodines c ON r.comodin_id = c.idcomodines
      ORDER BY r.id ASC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener elementos de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo elemento de ruleta
export const createRuletaItem = async (req, res) => {
  try {
    const { nombre, tipo, comodin_id, texto_personalizado, puntos, activo } = req.body;

    console.log('📝 Datos recibidos:', { nombre, tipo, comodin_id, texto_personalizado, puntos, activo });

    // Convertir activo de string a booleano
    const activoBoolean = activo === 'true' || activo === true;

    // Preparar los datos según el tipo
    let comodinId = null;
    let textoPersonalizado = null;

    if (tipo === 'comodin') {
      comodinId = comodin_id;
    } else if (tipo === 'puntos') {
      const puntosValue = parseInt(puntos) || 0;
      textoPersonalizado = puntosValue > 0 ? `+${puntosValue}` : `${puntosValue}`;
    } else if (tipo === 'personalizado') {
      textoPersonalizado = texto_personalizado;
    }

    console.log('🔧 Datos procesados:', { nombre, tipo, comodinId, textoPersonalizado, activoBoolean });

    const [result] = await connection.query(`
      INSERT INTO ruleta (nombre, tipo, comodin_id, texto_personalizado, activo)
      VALUES (?, ?, ?, ?, ?)
    `, [nombre, tipo, comodinId, textoPersonalizado, activoBoolean]);

    res.status(201).json({
      success: true,
      message: 'Elemento de ruleta creado correctamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear elemento de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar elemento de ruleta
export const updateRuletaItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, comodin_id, texto_personalizado, puntos, activo } = req.body;

    // Convertir activo de string a booleano
    const activoBoolean = activo === 'true' || activo === true;

    // Preparar los datos según el tipo
    let comodinId = null;
    let textoPersonalizado = null;

    if (tipo === 'comodin') {
      comodinId = comodin_id;
    } else if (tipo === 'puntos') {
      const puntosValue = parseInt(puntos) || 0;
      textoPersonalizado = puntosValue > 0 ? `+${puntosValue}` : `${puntosValue}`;
    } else if (tipo === 'personalizado') {
      textoPersonalizado = texto_personalizado;
    }

    await connection.query(`
      UPDATE ruleta 
      SET nombre = ?, tipo = ?, comodin_id = ?, texto_personalizado = ?, activo = ?
      WHERE id = ?
    `, [nombre, tipo, comodinId, textoPersonalizado, activoBoolean, id]);

    res.json({
      success: true,
      message: 'Elemento de ruleta actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar elemento de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar elemento de ruleta
export const deleteRuletaItem = async (req, res) => {
  try {
    const { id } = req.params;

    await connection.query('DELETE FROM ruleta WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Elemento de ruleta eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar elemento de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener configuración de ruleta
export const getRuletaConfiguracion = async (req, res) => {
  try {
    const [rows] = await connection.query('SELECT * FROM configuracion_ruleta WHERE id = 1');
    
    if (rows.length === 0) {
      // Si no existe, crear configuración por defecto
      await connection.query(`
        INSERT INTO configuracion_ruleta (id, ruleta_activa, max_giros_por_dia) 
        VALUES (1, false, 3)
      `);
      
      res.json({
        success: true,
        data: {
          ruleta_activa: false,
          max_giros_por_dia: 3
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          ruleta_activa: rows[0].ruleta_activa === 1,
          max_giros_por_dia: rows[0].max_giros_por_dia
        }
      });
    }
  } catch (error) {
    console.error('Error al obtener configuración de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar configuración de ruleta
export const updateRuletaConfiguracion = async (req, res) => {
  try {
    const { ruleta_activa, max_giros_por_dia } = req.body;

    // Actualizar configuración
    await connection.query(`
      INSERT INTO configuracion_ruleta (id, ruleta_activa, max_giros_por_dia) 
      VALUES (1, ?, ?)
      ON DUPLICATE KEY UPDATE 
        ruleta_activa = VALUES(ruleta_activa),
        max_giros_por_dia = VALUES(max_giros_por_dia)
    `, [ruleta_activa ? 1 : 0, max_giros_por_dia]);

    res.json({
      success: true,
      message: 'Configuración de ruleta actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar configuración de ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Girar la ruleta (para jugadores y administradores)
export const girarRuleta = async (req, res) => {
  try {
    const { nickname } = req.usuario;

    // Verificar si la ruleta está activa
    const [configRows] = await connection.query('SELECT ruleta_activa, max_giros_por_dia FROM configuracion_ruleta WHERE id = 1');
    
    if (!configRows.length || configRows[0].ruleta_activa !== 1) {
      return res.status(400).json({
        success: false,
        message: 'La ruleta no está activa'
      });
    }

    // Verificar si el usuario ya giró hoy
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const [girosHoy] = await connection.query(`
      SELECT COUNT(*) as giros FROM giros_ruleta 
      WHERE usuario_nickname = ? AND fecha_giro = ?
    `, [nickname, today]);

    if (girosHoy[0].giros >= configRows[0].max_giros_por_dia) {
      return res.status(400).json({
        success: false,
        message: `Ya has girado la ruleta ${configRows[0].max_giros_por_dia} vez(es) hoy. Vuelve mañana.`
      });
    }

    // Obtener elementos activos de la ruleta
    const [ruletaItems] = await connection.query(`
      SELECT r.*, c.nombre as comodin_nombre, c.foto as comodin_foto
      FROM ruleta r
      LEFT JOIN comodines c ON r.comodin_id = c.idcomodines
      WHERE r.activo = 1
      ORDER BY r.id ASC
    `);

    if (ruletaItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay elementos disponibles en la ruleta'
      });
    }

    // Simular giro de ruleta (selección aleatoria simple)
    const elementoGanado = ruletaItems[Math.floor(Math.random() * ruletaItems.length)];

    // Procesar el resultado según el tipo
    let puntosGanados = null;
    
    if (elementoGanado.tipo === 'comodin' && elementoGanado.comodin_id) {
      // Si es un comodín, asignarlo al usuario
      await connection.query(`
        INSERT INTO usuario_comodines (usuario_nickname, comodin_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE fecha_obtencion = CURRENT_TIMESTAMP
      `, [nickname, elementoGanado.comodin_id]);
    } else if (elementoGanado.tipo === 'puntos') {
      // Si son puntos, extraer el valor del texto_personalizado
      let puntos = 0;
      if (elementoGanado.texto_personalizado) {
        // El texto_personalizado contiene algo como "+10" o "-5"
        puntos = parseInt(elementoGanado.texto_personalizado) || 0;
      }
      
      puntosGanados = puntos;
      console.log(`Procesando puntos: ${puntos} para jugador: ${nickname}`);
      
      if (puntos !== 0) {
        // Obtener la edición activa
        const [edicionRows] = await connection.query(`
          SELECT idEdicion FROM edicion ORDER BY idEdicion DESC LIMIT 1
        `);
        
        if (edicionRows.length > 0) {
          const idEdicion = edicionRows[0].idEdicion;
          console.log(`Edición activa: ${idEdicion}`);
          
          // Verificar si el jugador ya existe en la tabla general
          const [jugadorRows] = await connection.query(`
            SELECT id, puntos_totales FROM tabla_general WHERE jugador_nickname = ? AND idEdicion = ?
          `, [nickname, idEdicion]);
          
          if (jugadorRows.length > 0) {
            // Actualizar puntos existentes (permitir puntos negativos)
            const puntosAnteriores = jugadorRows[0].puntos_totales;
            const nuevosPuntos = Math.max(0, puntosAnteriores + puntos); // Mínimo 0 puntos
            console.log(`Actualizando puntos: ${puntosAnteriores} + ${puntos} = ${nuevosPuntos}`);
            
            await connection.query(`
              UPDATE tabla_general 
              SET puntos_totales = ? 
              WHERE jugador_nickname = ? AND idEdicion = ?
            `, [nuevosPuntos, nickname, idEdicion]);
          } else {
            // Crear nueva entrada con los puntos (mínimo 0)
            const puntosIniciales = Math.max(0, puntos);
            console.log(`Creando nueva entrada con ${puntosIniciales} puntos`);
            await connection.query(`
              INSERT INTO tabla_general (idEdicion, jugador_nickname, puntos_totales, partidas_jugadas, partidas_ganadas)
              VALUES (?, ?, ?, 0, 0)
            `, [idEdicion, nickname, puntosIniciales]);
          }
        }
      }
    }

    // Registrar el giro en la tabla giros_ruleta
    const now = new Date();
    const horaGiro = now.toTimeString().split(' ')[0]; // Formato HH:MM:SS
    
    await connection.query(`
      INSERT INTO giros_ruleta (usuario_nickname, fecha_giro, hora_giro, elemento_ganado_id, elemento_ganado_nombre, tipo_elemento, puntos_ganados)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [nickname, today, horaGiro, elementoGanado.id, elementoGanado.nombre, elementoGanado.tipo, puntosGanados]);

    // Preparar respuesta
    let puntosNumericos = null;
    if (elementoGanado.tipo === 'puntos' && elementoGanado.texto_personalizado) {
      puntosNumericos = parseInt(elementoGanado.texto_personalizado) || 0;
    }

    res.json({
      success: true,
      message: '¡Giro exitoso!',
      data: {
        elemento: elementoGanado,
        tipo: elementoGanado.tipo,
        nombre: elementoGanado.tipo === 'comodin' ? elementoGanado.comodin_nombre : elementoGanado.nombre,
        descripcion: elementoGanado.nombre,
        imagen: elementoGanado.tipo === 'comodin' ? elementoGanado.comodin_foto : null,
        texto_personalizado: elementoGanado.texto_personalizado,
        puntos: elementoGanado.tipo === 'puntos' ? elementoGanado.texto_personalizado : null,
        puntos_numericos: puntosNumericos,
        giros_restantes: Math.max(0, configRows[0].max_giros_por_dia - (girosHoy[0].giros + 1))
      }
    });
  } catch (error) {
    console.error('Error al girar ruleta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener historial de giros de un usuario
export const getHistorialGiros = async (req, res) => {
  try {
    const { nickname } = req.usuario;

    const [giros] = await connection.query(`
      SELECT g.*, r.nombre as elemento_nombre, r.tipo as elemento_tipo
      FROM giros_ruleta g
      LEFT JOIN ruleta r ON g.elemento_ganado_id = r.id
      WHERE g.usuario_nickname = ?
      ORDER BY g.fecha_giro DESC, g.hora_giro DESC
      LIMIT 10
    `, [nickname]);

    res.json({
      success: true,
      data: giros
    });
  } catch (error) {
    console.error('Error al obtener historial de giros:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de giros de un usuario
export const getEstadisticasGiros = async (req, res) => {
  try {
    const { nickname } = req.usuario;
    const today = new Date().toISOString().split('T')[0];

    // Giros de hoy
    const [girosHoy] = await connection.query(`
      SELECT COUNT(*) as giros FROM giros_ruleta 
      WHERE usuario_nickname = ? AND fecha_giro = ?
    `, [nickname, today]);

    // Configuración de ruleta
    const [configRows] = await connection.query('SELECT max_giros_por_dia FROM configuracion_ruleta WHERE id = 1');
    const maxGirosPorDia = configRows.length > 0 ? configRows[0].max_giros_por_dia : 1;

    // Total de giros
    const [totalGiros] = await connection.query(`
      SELECT COUNT(*) as total FROM giros_ruleta 
      WHERE usuario_nickname = ?
    `, [nickname]);

    res.json({
      success: true,
      data: {
        giros_hoy: girosHoy[0].giros,
        max_giros_por_dia: maxGirosPorDia,
        giros_restantes: Math.max(0, maxGirosPorDia - girosHoy[0].giros),
        total_giros: totalGiros[0].total
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de giros:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}; 