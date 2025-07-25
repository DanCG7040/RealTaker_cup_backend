import connection from '../db.js';
import jwt from 'jsonwebtoken';
import { cloudinary } from '../config/cloudinary.js';

export const getAllLogros = async (req, res) => {
    try {
        console.log('Obteniendo todos los logros...'); // Debug log
        const [logros] = await connection.query('SELECT * FROM logros ORDER BY nombre ASC');
        console.log('Logros obtenidos de la BD:', logros); // Debug log
        
        return res.status(200).json({
            success: true,
            data: logros,
            message: 'Logros obtenidos exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener logros:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los logros',
            error: error.message
        });
    }
};

export const getLogroById = async (req, res) => {
    try {
        const { idLogros } = req.params;
        const [logros] = await connection.query(
            'SELECT * FROM logros WHERE idlogros = ?',
            [idLogros]
        );

        if (logros.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Logro no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: logros[0],
            message: 'Logro encontrado exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener logro:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el logro',
            error: error.message
        });
    }
};

export const createLogro = async (req, res) => {
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
            'INSERT INTO logros (nombre, descripcion, foto) VALUES (?, ?, ?)',
            [nombre, descripcion, fotoURL]
        );

        const [nuevoLogro] = await connection.query(
            'SELECT * FROM logros WHERE idlogros = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            data: nuevoLogro[0],
            message: 'Logro creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear logro:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear el logro',
            error: error.message
        });
    }
};

export const updateLogro = async (req, res) => {
    try {
        const { idLogros } = req.params;
        const { nombre, descripcion } = req.body;
        let fotoURL = null;

        // Verificar que el logro existe
        const [logro] = await connection.query(
            'SELECT * FROM logros WHERE idlogros = ?',
            [idLogros]
        );

        if (logro.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Logro no encontrado'
            });
        }

        // Procesar imagen si fue enviada
        if (req.file) {
            try {
                fotoURL = req.file.path;
                // Si el logro ya tenía una foto, eliminarla de Cloudinary
                if (logro[0].foto) {
                    const publicId = logro[0].foto.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`logros/${publicId}`);
                }
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error al procesar la imagen' 
                });
            }
        }

        // Actualizar el logro
        await connection.query(
            'UPDATE logros SET nombre = ?, descripcion = ?, foto = COALESCE(?, foto) WHERE idlogros = ?',
            [nombre, descripcion, fotoURL, idLogros]
        );

        const [logroActualizado] = await connection.query(
            'SELECT * FROM logros WHERE idlogros = ?',
            [idLogros]
        );

        return res.status(200).json({
            success: true,
            data: logroActualizado[0],
            message: 'Logro actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar logro:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el logro',
            error: error.message
        });
    }
};

export const deleteLogro = async (req, res) => {
    try {
        const { idLogros } = req.params;
        
        // Verificar si el logro existe
        const [existingLogro] = await connection.query(
            'SELECT * FROM logros WHERE idlogros = ?',
            [idLogros]
        );

        if (existingLogro.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Logro no encontrado'
            });
        }

        // Eliminar el logro
        await connection.query(
            'DELETE FROM logros WHERE idlogros = ?',
            [idLogros]
        );

        res.json({
            success: true,
            message: 'Logro eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar logro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}; 

// Obtener logros destacados para el inicio
export const getLogrosDestacados = async (req, res) => {
    try {
        // Obtener logros ordenados por nombre (ya que no existe la tabla usuarios_logros)
        const query = `
            SELECT l.*, 0 as usuarios_conseguidos
            FROM logros l
            ORDER BY l.nombre ASC
            LIMIT 5
        `;
        
        const [logros] = await connection.query(query);
        
        return res.status(200).json({
            success: true,
            data: logros,
            message: 'Logros destacados obtenidos exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener logros destacados:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los logros destacados',
            error: error.message
        });
    }
};

 