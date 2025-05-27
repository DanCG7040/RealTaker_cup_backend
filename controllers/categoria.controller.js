import connection from '../db.js';

const getAllCategorias = async (req, res) => {
    try {
        const [categorias] = await connection.query('SELECT * FROM categoria ORDER BY nombre ASC');
        
        return res.status(200).json({
            success: true,
            data: categorias,
            message: 'Categorías obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las categorías',
            error: error.message
        });
    }
};

const getCategoriaById = async (req, res) => {
    try {
        const { id } = req.params;
        const [categorias] = await connection.query('SELECT * FROM categoria WHERE id = ?', [id]);

        if (categorias.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            data: categorias[0],
            message: 'Categoría encontrada exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener categoría:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener la categoría',
            error: error.message
        });
    }
};

const createCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoría es requerido'
            });
        }

        const [result] = await connection.query(
            'INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );

        const [categoria] = await connection.query(
            'SELECT * FROM categoria WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            data: categoria[0],
            message: 'Categoría creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear la categoría',
            error: error.message
        });
    }
};

const updateCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoría es requerido'
            });
        }

        const [result] = await connection.query(
            'UPDATE categoria SET nombre = ?, descripcion = ? WHERE id = ?',
            [nombre, descripcion, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        const [categoria] = await connection.query(
            'SELECT * FROM categoria WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            data: categoria[0],
            message: 'Categoría actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la categoría',
            error: error.message
        });
    }
};

const deleteCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await connection.query(
            'DELETE FROM categoria WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar la categoría',
            error: error.message
        });
    }
};

export {
    getAllCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria
}; 