import connection from '../db.js';
import { crearHistoricoAutomatico } from './historico.controller.js';

// Crear una nueva edición del torneo
export const createEdicion = async (req, res) => {
    try {
        const { idEdicion, fecha_inicio, fecha_fin } = req.body;

        // Validaciones
        if (!idEdicion || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar que el año sea un número válido
        if (isNaN(idEdicion) || idEdicion < 2020 || idEdicion > 2030) {
            return res.status(400).json({
                success: false,
                message: 'El año debe ser un número válido entre 2020 y 2030'
            });
        }

        // Validar que la fecha de fin sea posterior a la de inicio
        if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
        }

        // Verificar si ya existe una edición con ese año
        const [existingEdicion] = await connection.query(
            'SELECT * FROM edicion WHERE idEdicion = ?',
            [idEdicion]
        );

        if (existingEdicion.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una edición del torneo para el año ' + idEdicion
            });
        }

        // Crear la nueva edición
        await connection.query(
            'INSERT INTO edicion (idEdicion, fecha_inicio, fecha_fin) VALUES (?, ?, ?)',
            [idEdicion, fecha_inicio, fecha_fin]
        );

        // Crear histórico automáticamente de la edición anterior
        await crearHistoricoAutomatico(idEdicion);

        // Obtener la edición creada
        const [nuevaEdicion] = await connection.query(
            'SELECT * FROM edicion WHERE idEdicion = ?',
            [idEdicion]
        );

        return res.status(201).json({
            success: true,
            data: nuevaEdicion[0],
            message: 'Edición del torneo creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear edición:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear la edición del torneo',
            error: error.message
        });
    }
};

// Obtener todas las ediciones
export const getAllEdiciones = async (req, res) => {
    try {
        const [ediciones] = await connection.query(
            'SELECT * FROM edicion ORDER BY idEdicion DESC'
        );

        return res.status(200).json({
            success: true,
            data: ediciones,
            message: 'Ediciones obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener ediciones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las ediciones',
            error: error.message
        });
    }
};

// Obtener una edición por ID
export const getEdicionById = async (req, res) => {
    try {
        const { idEdicion } = req.params;
        const [ediciones] = await connection.query(
            'SELECT * FROM edicion WHERE idEdicion = ?',
            [idEdicion]
        );

        if (ediciones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Edición no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            data: ediciones[0],
            message: 'Edición encontrada exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener edición:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener la edición',
            error: error.message
        });
    }
};

// Actualizar una edición
export const updateEdicion = async (req, res) => {
    try {
        const { idEdicion } = req.params;
        const { fecha_inicio, fecha_fin } = req.body;

        // Verificar que la edición existe
        const [existingEdicion] = await connection.query(
            'SELECT * FROM edicion WHERE idEdicion = ?',
            [idEdicion]
        );

        if (existingEdicion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Edición no encontrada'
            });
        }

        // Validar que la fecha de fin sea posterior a la de inicio
        if (fecha_inicio && fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
        }

        // Actualizar la edición
        await connection.query(
            'UPDATE edicion SET fecha_inicio = COALESCE(?, fecha_inicio), fecha_fin = COALESCE(?, fecha_fin) WHERE idEdicion = ?',
            [fecha_inicio, fecha_fin, idEdicion]
        );

        const [edicionActualizada] = await connection.query(
            'SELECT * FROM edicion WHERE idEdicion = ?',
            [idEdicion]
        );

        return res.status(200).json({
            success: true,
            data: edicionActualizada[0],
            message: 'Edición actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar edición:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la edición',
            error: error.message
        });
    }
};

// Eliminar una edición
export const deleteEdicion = async (req, res) => {
    try {
        const { idEdicion } = req.params;

        // Verificar que la edición existe
        const [existingEdicion] = await connection.query(
            'SELECT * FROM edicion WHERE idEdicion = ?',
            [idEdicion]
        );

        if (existingEdicion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Edición no encontrada'
            });
        }

        // Eliminar registros relacionados primero (en orden de dependencia)
        await connection.query('DELETE FROM tabla_general WHERE idEdicion = ?', [idEdicion]);
        await connection.query('DELETE FROM torneo_juegos WHERE torneo_id = ?', [idEdicion]);
        await connection.query('DELETE FROM torneo_participantes WHERE idEdicion = ?', [idEdicion]);
        
        // Eliminar la edición
        await connection.query('DELETE FROM edicion WHERE idEdicion = ?', [idEdicion]);

        return res.status(200).json({
            success: true,
            message: 'Edición eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar edición:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar la edición',
            error: error.message
        });
    }
};

// Asignar juegos a una edición
export const asignarJuegos = async (req, res) => {
    try {
        const { idEdicion } = req.params;
        const { juegos } = req.body; // Array de IDs de juegos

        if (!juegos || !Array.isArray(juegos) || juegos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe seleccionar al menos un juego'
            });
        }

        // Verificar que la edición existe
        const [existingEdicion] = await connection.query(
            'SELECT * FROM edicion WHERE idEdicion = ?',
            [idEdicion]
        );

        if (existingEdicion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Edición no encontrada'
            });
        }

        // Eliminar juegos anteriores de esta edición
        await connection.query('DELETE FROM torneo_juegos WHERE torneo_id = ?', [idEdicion]);

        // Insertar los nuevos juegos
        for (const juegoId of juegos) {
            await connection.query(
                'INSERT INTO torneo_juegos (torneo_id, juego_id) VALUES (?, ?)',
                [idEdicion, juegoId]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Juegos asignados exitosamente'
        });
    } catch (error) {
        console.error('Error al asignar juegos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al asignar juegos',
            error: error.message
        });
    }
};

// Asignar jugadores a una edición
export const asignarJugadores = async (req, res) => {
    try {
        const { idEdicion } = req.params;
        const { jugadores } = req.body; // Array de nicknames de jugadores

        if (!jugadores || !Array.isArray(jugadores) || jugadores.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe seleccionar al menos un jugador'
            });
        }

        // Verificar que la edición existe
        const [existingEdicion] = await connection.query(
            'SELECT * FROM edicion WHERE idEdicion = ?',
            [idEdicion]
        );

        if (existingEdicion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Edición no encontrada'
            });
        }

        // Eliminar jugadores anteriores de esta edición
        await connection.query('DELETE FROM torneo_participantes WHERE idEdicion = ?', [idEdicion]);

        // Insertar los nuevos jugadores
        for (const nickname of jugadores) {
            await connection.query(
                'INSERT INTO torneo_participantes (idEdicion, jugador_nickname) VALUES (?, ?)',
                [idEdicion, nickname]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Jugadores asignados exitosamente'
        });
    } catch (error) {
        console.error('Error al asignar jugadores:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al asignar jugadores',
            error: error.message
        });
    }
};

// Obtener juegos de una edición
export const getJuegosByEdicion = async (req, res) => {
    try {
        const { idEdicion } = req.params;

        const [juegos] = await connection.query(`
            SELECT j.*, c.nombre as categoria_nombre 
            FROM juegos j 
            INNER JOIN torneo_juegos tj ON j.id = tj.juego_id 
            INNER JOIN categoria c ON j.categoria_id = c.id 
            WHERE tj.torneo_id = ?
            ORDER BY j.nombre
        `, [idEdicion]);

        return res.status(200).json({
            success: true,
            data: juegos,
            message: 'Juegos de la edición obtenidos exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener juegos de la edición:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los juegos de la edición',
            error: error.message
        });
    }
};

// Obtener jugadores de una edición
export const getJugadoresByEdicion = async (req, res) => {
    try {
        const { idEdicion } = req.params;

        const [jugadores] = await connection.query(`
            SELECT u.nickname, u.email, u.foto, u.descripcion 
            FROM usuarios u 
            INNER JOIN torneo_participantes tp ON u.nickname = tp.jugador_nickname 
            WHERE tp.idEdicion = ? AND u.rol = 2
            ORDER BY u.nickname
        `, [idEdicion]);

        return res.status(200).json({
            success: true,
            data: jugadores,
            message: 'Jugadores de la edición obtenidos exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener jugadores de la edición:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los jugadores de la edición',
            error: error.message
        });
    }
}; 