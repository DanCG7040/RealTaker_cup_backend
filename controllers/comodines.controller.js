import connection from '../db.js';
import jwt from 'jsonwebtoken';
import { cloudinary } from '../config/cloudinary.js';

export const getAllComodines = async (req, res) => {
    try {
        const [comodines] = await connection.query('SELECT * FROM comodines ORDER BY nombre ASC');
        
        return res.status(200).json({
            success: true,
            data: comodines,
            message: 'Comodines obtenidos exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener comodines:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los comodines',
            error: error.message
        });
    }
};

export const getComodinById = async (req, res) => {
    try {
        const { idComodines } = req.params;
        const [comodines] = await connection.query(
            'SELECT * FROM comodines WHERE idcomodines = ?',
            [idComodines]
        );

        if (comodines.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comodín no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: comodines[0],
            message: 'Comodín encontrado exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener comodín:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el comodín',
            error: error.message
        });
    }
};

export const createComodin = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        let fotoURL = null;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido'
            });
        }

        // Procesar imagen si fue enviada
        if (req.file) {
            try {
                fotoURL = req.file.path;
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error al procesar la imagen' 
                });
            }
        }

        const [result] = await connection.query(
            'INSERT INTO comodines (nombre, descripcion, foto) VALUES (?, ?, ?)',
            [nombre, descripcion, fotoURL]
        );

        const [nuevoComodin] = await connection.query(
            'SELECT * FROM comodines WHERE idcomodines = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            data: nuevoComodin[0],
            message: 'Comodín creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear comodín:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear el comodín',
            error: error.message
        });
    }
};

export const updateComodin = async (req, res) => {
    try {
        const { idComodines } = req.params;
        const { nombre, descripcion } = req.body;
        let fotoURL = null;

        // Verificar que el comodín existe
        const [comodin] = await connection.query(
            'SELECT * FROM comodines WHERE idcomodines = ?',
            [idComodines]
        );

        if (comodin.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comodín no encontrado'
            });
        }

        // Procesar imagen si fue enviada
        if (req.file) {
            try {
                fotoURL = req.file.path;
                // Si el comodín ya tenía una foto, eliminarla de Cloudinary
                if (comodin[0].foto) {
                    const publicId = comodin[0].foto.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`comodines/${publicId}`);
                }
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error al procesar la imagen' 
                });
            }
        }

        // Actualizar el comodín
        await connection.query(
            'UPDATE comodines SET nombre = ?, descripcion = ?, foto = COALESCE(?, foto) WHERE idcomodines = ?',
            [nombre, descripcion, fotoURL, idComodines]
        );

        const [comodinActualizado] = await connection.query(
            'SELECT * FROM comodines WHERE idcomodines = ?',
            [idComodines]
        );

        return res.status(200).json({
            success: true,
            data: comodinActualizado[0],
            message: 'Comodín actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar comodín:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el comodín',
            error: error.message
        });
    }
};

export const deleteComodin = async (req, res) => {
    try {
        const { idComodines } = req.params;
        
        // Verificar si el comodín existe
        const [existingComodin] = await connection.query(
            'SELECT * FROM comodines WHERE idcomodines = ?',
            [idComodines]
        );

        if (existingComodin.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comodín no encontrado'
            });
        }

        // Eliminar el comodín
        await connection.query(
            'DELETE FROM comodines WHERE idcomodines = ?',
            [idComodines]
        );

        res.json({
            success: true,
            message: 'Comodín eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar comodín:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Obtener todos los comodines (público)
export const getAllPublic = async (req, res) => {
  try {
    const [rows] = await connection.query(
      'SELECT * FROM comodines WHERE visible = 1 ORDER BY nombre ASC'
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener comodines:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}; 