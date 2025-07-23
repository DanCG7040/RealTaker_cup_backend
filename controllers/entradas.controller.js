import connection from '../db.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Obtener todas las entradas
export const getAll = async (req, res) => {
  try {
    const [rows] = await connection.query(
      'SELECT * FROM entradas ORDER BY orden ASC, id DESC'
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener entradas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Crear nueva entrada
export const create = async (req, res) => {
  try {
    const { titulo, contenido, orden, visible } = req.body;
    let imagen_url = null;
    
    if (!titulo || !contenido) {
      return res.status(400).json({
        success: false,
        error: 'Título y contenido son obligatorios'
      });
    }

    // Subir imagen si se proporciona
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      imagen_url = result.secure_url;
    }

    const [result] = await connection.query(
      'INSERT INTO entradas (titulo, contenido, imagen_url, orden, visible) VALUES (?, ?, ?, ?, ?)',
      [titulo, contenido, imagen_url, orden || 0, visible !== undefined ? visible : true]
    );

    const [newEntrada] = await connection.query(
      'SELECT * FROM entradas WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newEntrada[0],
      message: 'Entrada creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear entrada:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Actualizar entrada
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, orden, visible } = req.body;
    let imagen_url = null;
    
    if (!titulo || !contenido) {
      return res.status(400).json({
        success: false,
        error: 'Título y contenido son obligatorios'
      });
    }

    // Subir imagen si se proporciona
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      imagen_url = result.secure_url;
    }

    let query = 'UPDATE entradas SET titulo = ?, contenido = ?, orden = ?, visible = ?';
    let params = [titulo, contenido, orden || 0, visible !== undefined ? visible : true];

    // Si hay nueva imagen, incluirla en la actualización
    if (imagen_url) {
      query += ', imagen_url = ?';
      params.push(imagen_url);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await connection.query(query, params);

    const [updatedEntrada] = await connection.query(
      'SELECT * FROM entradas WHERE id = ?',
      [id]
    );

    if (updatedEntrada.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entrada no encontrada'
      });
    }

    res.json({
      success: true,
      data: updatedEntrada[0],
      message: 'Entrada actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar entrada:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Eliminar entrada
export const deleteOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await connection.query(
      'DELETE FROM entradas WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entrada no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Entrada eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar entrada:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}; 