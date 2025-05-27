import connection from '../db.js';
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
        const [categoriaExiste] = await connection.query(
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
        const [result] = await connection.query(
            'INSERT INTO juegos (nombre, categoria_id, foto) VALUES (?, ?, ?)',
            [nombre, categoria, fotoURL]
        );

        // Obtener el juego recién creado
        const [nuevoJuego] = await connection.query(
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

export const obtenerJuegos = async (req, res) => {
    try {
        const [juegos] = await connection.query(
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

export const obtenerJuegoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [juego] = await connection.query(
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

export const actualizarJuego = async (req, res) => {
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
                error: 'Solo los administradores pueden actualizar juegos' 
            });
        }

        const { id } = req.params;
        const { nombre, categoria } = req.body;

        // Verificar si el juego existe
        const [juegoExiste] = await connection.query(
            'SELECT * FROM juegos WHERE id = ?',
            [id]
        );

        if (juegoExiste.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Juego no encontrado'
            });
        }

        let fotoURL = juegoExiste[0].foto;

        // Si se envía una nueva categoría, verificar que exista
        if (categoria) {
            const [categoriaExiste] = await connection.query(
                'SELECT id FROM categoria WHERE id = ?',
                [categoria]
            );

            if (categoriaExiste.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'La categoría especificada no existe'
                });
            }
        }

        // Procesar nueva imagen si fue enviada
        if (req.file) {
            try {
                // Si ya existe una foto anterior, eliminarla de Cloudinary
                if (juegoExiste[0].foto) {
                    const publicId = juegoExiste[0].foto.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`juegos/${publicId}`);
                }
                
                // La URL de la nueva imagen
                fotoURL = req.file.path;
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error al procesar la imagen' 
                });
            }
        }

        // Actualizar el juego
        const updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (categoria) updateData.categoria_id = categoria;
        if (fotoURL) updateData.foto = fotoURL;

        if (Object.keys(updateData).length > 0) {
            await connection.query(
                'UPDATE juegos SET ? WHERE id = ?',
                [updateData, id]
            );
        }

        // Obtener el juego actualizado
        const [juegoActualizado] = await connection.query(
            `SELECT j.*, c.nombre as categoria_nombre 
             FROM juegos j 
             JOIN categoria c ON j.categoria_id = c.id 
             WHERE j.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Juego actualizado correctamente',
            data: juegoActualizado[0]
        });

    } catch (error) {
        console.error('Error al actualizar juego:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al actualizar el juego'
        });
    }
};

export const eliminarJuego = async (req, res) => {
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
                error: 'Solo los administradores pueden eliminar juegos' 
            });
        }

        const { id } = req.params;

        // Verificar si el juego existe y obtener su información
        const [juego] = await connection.query(
            'SELECT * FROM juegos WHERE id = ?',
            [id]
        );

        if (juego.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Juego no encontrado'
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

        // Eliminar el juego de la base de datos
        await connection.query(
            'DELETE FROM juegos WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Juego eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar juego:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al eliminar el juego'
        });
    }
};

const getAllJuegos = async (req, res) => {
    try {
        const [juegos] = await connection.query(
            `SELECT j.*, c.nombre as categoria_nombre 
             FROM juegos j 
             LEFT JOIN categoria c ON j.categoria_id = c.id 
             ORDER BY j.nombre ASC`
        );
        
        return res.status(200).json({
            success: true,
            data: juegos,
            message: 'Juegos obtenidos exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener juegos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los juegos',
            error: error.message
        });
    }
};

const getJuegoById = async (req, res) => {
    try {
        const { id } = req.params;
        const [juegos] = await connection.query(
            `SELECT j.*, c.nombre as categoria_nombre 
             FROM juegos j 
             LEFT JOIN categoria c ON j.categoria_id = c.id 
             WHERE j.id = ?`,
            [id]
        );

        if (juegos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Juego no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: juegos[0],
            message: 'Juego encontrado exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener juego:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el juego',
            error: error.message
        });
    }
};

const createJuego = async (req, res) => {
    try {
        const { nombre, categoria } = req.body;
        let fotoURL = null;

        if (!nombre || !categoria) {
            return res.status(400).json({
                success: false,
                message: 'El nombre y la categoría son requeridos'
            });
        }

        // Verificar que la categoría existe
        const [categoriaCheck] = await connection.query('SELECT id FROM categoria WHERE id = ?', [categoria]);
        if (categoriaCheck.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La categoría seleccionada no existe'
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
            'INSERT INTO juegos (nombre, categoria_id, foto) VALUES (?, ?, ?)',
            [nombre, categoria, fotoURL]
        );

        const [nuevoJuego] = await connection.query(
            'SELECT j.*, c.nombre as categoria_nombre FROM juegos j LEFT JOIN categoria c ON j.categoria_id = c.id WHERE j.id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            data: nuevoJuego[0],
            message: 'Juego creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear juego:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear el juego',
            error: error.message
        });
    }
};

const updateJuego = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, foto } = req.body;

        if (!nombre || !categoria) {
            return res.status(400).json({
                success: false,
                message: 'El nombre y la categoría son requeridos'
            });
        }

        // Verificar que la categoría existe
        const [categoriaCheck] = await connection.query(
            'SELECT id FROM categoria WHERE id = ?',
            [categoria]
        );
        
        if (categoriaCheck.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La categoría seleccionada no existe'
            });
        }

        // Verificar que el juego existe
        const [juegoExiste] = await connection.query(
            'SELECT * FROM juegos WHERE id = ?',
            [id]
        );

        if (juegoExiste.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Juego no encontrado'
            });
        }

        // Actualizar el juego
        await connection.query(
            'UPDATE juegos SET nombre = ?, categoria_id = ?, foto = ? WHERE id = ?',
            [nombre, categoria, foto, id]
        );

        // Obtener el juego actualizado
        const [juegoActualizado] = await connection.query(
            `SELECT j.*, c.nombre as categoria_nombre 
             FROM juegos j 
             LEFT JOIN categoria c ON j.categoria_id = c.id 
             WHERE j.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: juegoActualizado[0],
            message: 'Juego actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar juego:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el juego',
            error: error.message
        });
    }
};

const deleteJuego = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el juego existe
        const [juego] = await connection.query(
            'SELECT * FROM juegos WHERE id = ?',
            [id]
        );

        if (juego.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Juego no encontrado'
            });
        }

        // Eliminar el juego
        await connection.query(
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

export {
    getAllJuegos,
    getJuegoById,
    createJuego,
    updateJuego,
    deleteJuego
}; 