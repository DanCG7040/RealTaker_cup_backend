import connection from '../db.js';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Obtener todos los puntos
const getAllPuntos = async (req, res) => {
  try {
    const query = `
      SELECT id, tipo, posicion, puntos 
      FROM puntos_por_tipo_partida 
      ORDER BY tipo, posicion
    `;
    
    const [rows] = await connection.execute(query);
    
    res.json({
      success: true,
      message: 'Puntos obtenidos exitosamente',
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener puntos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener puntos por tipo
const getPuntosByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    if (!tipo || !['PVP', 'TodosContraTodos'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de partida inválido. Debe ser PVP o TodosContraTodos'
      });
    }
    
    const query = `
      SELECT id, tipo, posicion, puntos 
      FROM puntos_por_tipo_partida 
      WHERE tipo = ? 
      ORDER BY posicion
    `;
    
    const [rows] = await connection.execute(query, [tipo]);
    
    res.json({
      success: true,
      message: `Puntos para ${tipo} obtenidos exitosamente`,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener puntos por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear o actualizar puntos
const createOrUpdatePuntos = async (req, res) => {
  try {
    const { puntos } = req.body;
    
    if (!puntos || !Array.isArray(puntos) || puntos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de puntos válido'
      });
    }
    
    // Validar cada punto
    for (const punto of puntos) {
      if (!punto.tipo || !['PVP', 'TodosContraTodos'].includes(punto.tipo)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de partida inválido en uno o más puntos'
        });
      }
      
      if (!punto.posicion || !Number.isInteger(punto.posicion) || punto.posicion < 1) {
        return res.status(400).json({
          success: false,
          message: 'Posición inválida en uno o más puntos'
        });
      }
      
      if (!Number.isInteger(punto.puntos) || punto.puntos < 0) {
        return res.status(400).json({
          success: false,
          message: 'Puntos inválidos en uno o más puntos'
        });
      }
    }
    
    // Iniciar transacción usando query en lugar de execute
    await connection.query('START TRANSACTION');
    
    try {
      for (const punto of puntos) {
        // Verificar si ya existe un registro para este tipo y posición
        const checkQuery = `
          SELECT id FROM puntos_por_tipo_partida 
          WHERE tipo = ? AND posicion = ?
        `;
        
        const [existingRows] = await connection.execute(checkQuery, [punto.tipo, punto.posicion]);
        
        if (existingRows.length > 0) {
          // Actualizar registro existente
          const updateQuery = `
            UPDATE puntos_por_tipo_partida 
            SET puntos = ? 
            WHERE tipo = ? AND posicion = ?
          `;
          
          await connection.execute(updateQuery, [punto.puntos, punto.tipo, punto.posicion]);
        } else {
          // Crear nuevo registro
          const insertQuery = `
            INSERT INTO puntos_por_tipo_partida (tipo, posicion, puntos) 
            VALUES (?, ?, ?)
          `;
          
          await connection.execute(insertQuery, [punto.tipo, punto.posicion, punto.puntos]);
        }
      }
      
      // Confirmar transacción usando query
      await connection.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Puntos guardados exitosamente',
        data: {
          puntosGuardados: puntos.length
        }
      });
    } catch (error) {
      // Revertir transacción usando query
      await connection.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al guardar puntos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar puntos por ID
const deletePuntos = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    const query = 'DELETE FROM puntos_por_tipo_partida WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Puntos no encontrados'
      });
    }
    
    res.json({
      success: true,
      message: 'Puntos eliminados exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar puntos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export {
  getAllPuntos,
  getPuntosByTipo,
  createOrUpdatePuntos,
  deletePuntos
}; 