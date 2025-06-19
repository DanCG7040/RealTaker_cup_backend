import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { cloudinary } from '../config/cloudinary.js';

export const agregarJuego = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET);

        // Verificar si es administrador
        if (decoded.rol !== 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Solo los administradores pueden agregar juegos' 
            });
        }

        const { nombre, categoria } = req.body;
        let fotoURL = null;

        // Validar datos requeridos
        if (!nombre || !categoria) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y categoría son requeridos'
            });
        }

        // Verificar si la categoría existe
        const [categoriaExiste] = await pool.query(
            'SELECT id FROM categoria WHERE id = ?',
            [categoria]
        );

        if (categoriaExiste.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'La categoría especificada no existe'
            });
        }

        // Procesar imagen si fue enviada
        if (req.file) {
            try {
                // La URL de la imagen ya viene en req.file gracias a CloudinaryStorage
                fotoURL = req.file.path;
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error al procesar la imagen' 
                });
            }
        }

        // Insertar el juego en la base de datos
        const [result] = await pool.query(
            'INSERT INTO juegos (nombre, categoria_id, foto) VALUES (?, ?, ?)',
            [nombre, categoria, fotoURL]
        );

        // Obtener el juego recién creado
        const [nuevoJuego] = await pool.query(
            `SELECT j.*, c.nombre as categoria_nombre 
             FROM juegos j 
             JOIN categoria c ON j.categoria_id = c.id 
             WHERE j.id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Juego agregado correctamente',
            data: nuevoJuego[0]
        });

    } catch (error) {
        console.error('Error al agregar juego:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al agregar el juego'
        });
    }
};

export const getAllJuegos = async (req, res) => {
    try {
        const [juegos] = await pool.query(
            `SELECT j.*, c.nombre as categoria_nombre 
             FROM juegos j 
             JOIN categoria c ON j.categoria_id = c.id`
        );

        return res.status(200).json({
            success: true,
            data: juegos
        });

    } catch (error) {
        console.error('Error al obtener juegos:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener los juegos'
        });
    }
};

export const getJuegoById = async (req, res) => {
    try {
        const { id } = req.params;

        const [juego] = await pool.query(
            `SELECT j.*, c.nombre as categoria_nombre 
             FROM juegos j 
             JOIN categoria c ON j.categoria_id = c.id 
             WHERE j.id = ?`,
            [id]
        );

        if (juego.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Juego no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: juego[0]
        });

    } catch (error) {
        console.error('Error al obtener juego:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener el juego'
        });
    }
};

export const createJuego = async (req, res) => {
    try {
        const { nombre, categoria } = req.body;
        let fotoURL = null;

        // Validar datos requeridos
        if (!nombre || !categoria) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y categoría son requeridos'
            });
        }

        // Verificar si la categoría existe
        const [categoriaExiste] = await pool.query(
            'SELECT id FROM categoria WHERE id = ?',
            [categoria]
        );

        if (categoriaExiste.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'La categoría especificada no existe'
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

        // Insertar el juego en la base de datos
        const [result] = await pool.query(
            'INSERT INTO juegos (nombre, categoria_id, foto) VALUES (?, ?, ?)',
            [nombre, categoria, fotoURL]
        );

        // Obtener el juego recién creado
        const [nuevoJuego] = await pool.query(
            `SELECT j.*, c.nombre as categoria_nombre 
             FROM juegos j 
             JOIN categoria c ON j.categoria_id = c.id 
             WHERE j.id = ?`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Juego creado correctamente',
            data: nuevoJuego[0]
        });

    } catch (error) {
        console.error('Error al crear juego:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al crear el juego'
        });
    }
};

export const updateJuego = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria } = req.body;
        
        // Obtener el juego actual para verificar si tiene una imagen
        const [currentGame] = await pool.query('SELECT foto FROM juegos WHERE id = ?', [id]);
        
        let fotoUrl = currentGame[0]?.foto;

        // Si hay un nuevo archivo
        if (req.file) {
            // Si existe una foto anterior, eliminarla de Cloudinary
            if (currentGame[0]?.foto) {
                try {
                    // Extraer el public_id de la URL de Cloudinary
                    const publicId = currentGame[0].foto.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy('juegos/' + publicId);
                } catch (error) {
                    console.error('Error al eliminar imagen anterior:', error);
                }
            }
            
            // Actualizar con la nueva URL
            fotoUrl = req.file.path;
        }

        // Actualizar el juego en la base de datos
        const [result] = await pool.query(
            'UPDATE juegos SET nombre = ?, categoria_id = ?, foto = ? WHERE id = ?',
            [nombre, categoria, fotoUrl, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Juego no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Juego actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar juego:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el juego'
        });
    }
};

export const deleteJuego = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el juego existe
        const [juego] = await pool.query(
            'SELECT * FROM juegos WHERE id = ?',
            [id]
        );

        if (juego.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Juego no encontrado'
            });
        }

        // Si el juego tiene una foto, eliminarla de Cloudinary
        if (juego[0].foto) {
            try {
                const publicId = juego[0].foto.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`juegos/${publicId}`);
            } catch (error) {
                console.error('Error al eliminar imagen de Cloudinary:', error);
            }
        }

        // Eliminar el juego
        await pool.query(
            'DELETE FROM juegos WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Juego eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar juego:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el juego',
            error: error.message
        });
    }
}; 