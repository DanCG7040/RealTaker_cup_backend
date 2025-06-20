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

    // Convertir activo de string a booleano
    const activoBoolean = activo === 'true' || activo === true;

    // Preparar los datos según el tipo
    let comodinId = null;
    let textoPersonalizado = null;
    let puntosValue = null;

    if (tipo === 'comodin') {
      comodinId = comodin_id;
    } else if (tipo === 'puntos') {
      puntosValue = puntos;
    } else if (tipo === 'personalizado') {
      textoPersonalizado = texto_personalizado;
    }

    const [result] = await connection.query(`
      INSERT INTO ruleta (nombre, tipo, comodin_id, activo)
      VALUES (?, ?, ?, ?)
    `, [nombre, tipo, comodinId, activoBoolean]);

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

    if (tipo === 'comodin') {
      comodinId = comodin_id;
    }

    await connection.query(`
      UPDATE ruleta 
      SET nombre = ?, tipo = ?, comodin_id = ?, activo = ?
      WHERE id = ?
    `, [nombre, tipo, comodinId, activoBoolean, id]);

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

// Girar la ruleta (para jugadores)
export const girarRuleta = async (req, res) => {
  try {
    const { nickname } = req.usuario; // Asumiendo que el usuario está autenticado

    // Verificar si la ruleta está activa
    const [configRows] = await connection.query('SELECT ruleta_activa, max_giros_por_dia FROM configuracion_ruleta WHERE id = 1');
    if (!configRows.length || configRows[0].ruleta_activa !== 1) {
      return res.status(400).json({
        success: false,
        message: 'La ruleta no está activa'
      });
    }

    const maxGirosPorDia = configRows[0].max_giros_por_dia || 3;

    const today = new Date().toISOString().split('T')[0];
    const [girosHoy] = await connection.query(`
      SELECT COUNT(*) as count FROM usuario_comodines 
      WHERE usuario_nickname = ? AND DATE(fecha_obtencion) = ? AND obtenido_por_ruleta = 1
    `, [nickname, today]);

    if (girosHoy[0].count >= maxGirosPorDia) {
      return res.status(400).json({
        success: false,
        message: `Ya has alcanzado el límite de ${maxGirosPorDia} giros por día`
      });
    }

    // Obtener elementos activos de la ruleta
    const [ruletaItems] = await connection.query(`
      SELECT r.*, c.nombre as comodin_nombre, c.foto as comodin_foto
      FROM ruleta r
      LEFT JOIN comodines c ON r.comodin_id = c.idcomodines
      WHERE r.activo = 1
      ORDER BY r.orden ASC
    `);

    if (ruletaItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay elementos disponibles en la ruleta'
      });
    }

    // Simular giro de ruleta basado en probabilidades
    const totalProbabilidad = ruletaItems.reduce((sum, item) => sum + parseFloat(item.probabilidad), 0);
    let random = Math.random() * totalProbabilidad;
    let elementoGanado = null;

    for (const item of ruletaItems) {
      random -= parseFloat(item.probabilidad);
      if (random <= 0) {
        elementoGanado = item;
        break;
      }
    }

    if (!elementoGanado) {
      elementoGanado = ruletaItems[0]; // Fallback
    }

    // Procesar el resultado según el tipo
    if (elementoGanado.tipo === 'comodin' && elementoGanado.comodin_id) {
      // Si es un comodín, asignarlo al usuario
      await connection.query(`
        INSERT INTO usuario_comodines (usuario_nickname, comodin_id, obtenido_por_ruleta)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE fecha_obtencion = CURRENT_TIMESTAMP
      `, [nickname, elementoGanado.comodin_id]);
    } else if (elementoGanado.tipo === 'puntos') {
      // Si son puntos, agregarlos o restarlos de la tabla general
      const puntosTexto = elementoGanado.texto_personalizado || '0';
      let puntos = 0;
      
      // Manejar puntos positivos y negativos
      if (puntosTexto.startsWith('+')) {
        puntos = parseInt(puntosTexto.substring(1)) || 0;
      } else if (puntosTexto.startsWith('-')) {
        puntos = parseInt(puntosTexto) || 0; // Ya incluye el signo negativo
      } else {
        puntos = parseInt(puntosTexto) || 0;
      }
      
      // Obtener la edición activa
      const [edicionRows] = await connection.query(`
        SELECT idEdicion FROM edicion ORDER BY idEdicion DESC LIMIT 1
      `);
      
      if (edicionRows.length > 0) {
        const idEdicion = edicionRows[0].idEdicion;
        
        // Verificar si el jugador ya existe en la tabla general
        const [jugadorRows] = await connection.query(`
          SELECT id, puntos_totales FROM tabla_general WHERE jugador_nickname = ? AND idEdicion = ?
        `, [nickname, idEdicion]);
        
        if (jugadorRows.length > 0) {
          // Actualizar puntos existentes (pueden ser negativos)
          const nuevosPuntos = Math.max(0, jugadorRows[0].puntos_totales + puntos); // No permitir puntos negativos
          await connection.query(`
            UPDATE tabla_general 
            SET puntos_totales = ? 
            WHERE jugador_nickname = ? AND idEdicion = ?
          `, [nuevosPuntos, nickname, idEdicion]);
        } else {
          // Crear nueva entrada solo si los puntos son positivos
          const puntosIniciales = Math.max(0, puntos);
          await connection.query(`
            INSERT INTO tabla_general (idEdicion, jugador_nickname, puntos_totales, partidas_jugadas, partidas_ganadas)
            VALUES (?, ?, ?, 0, 0)
          `, [idEdicion, nickname, puntosIniciales]);
        }
      }
    }

    res.json({
      success: true,
      message: '¡Giro exitoso!',
      data: {
        elemento: elementoGanado,
        tipo: elementoGanado.tipo,
        nombre: elementoGanado.tipo === 'comodin' ? elementoGanado.comodin_nombre : elementoGanado.nombre,
        descripcion: elementoGanado.descripcion,
        imagen: elementoGanado.tipo === 'comodin' ? elementoGanado.comodin_foto : elementoGanado.imagen_url,
        texto_personalizado: elementoGanado.texto_personalizado,
        puntos: elementoGanado.tipo === 'puntos' ? elementoGanado.texto_personalizado : null,
        puntos_numericos: elementoGanado.tipo === 'puntos' ? parseInt(elementoGanado.texto_personalizado) || 0 : null
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