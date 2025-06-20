import connection from '../db.js';

// Obtener logros de usuarios
export const getUsuarioLogros = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT ul.*, 
             l.nombre as logro_nombre, 
             l.foto as logro_foto
      FROM usuario_logros ul
      JOIN logros l ON ul.logro_id = l.idlogros
      ORDER BY ul.fecha_obtencion DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener logros de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Asignar logro a usuario
export const asignarLogroUsuario = async (req, res) => {
  try {
    const { usuario_nickname, logro_id } = req.body;

    if (!usuario_nickname || !logro_id) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y logro son requeridos'
      });
    }

    // Verificar que el usuario existe
    const [usuarioRows] = await connection.query('SELECT nickname FROM usuarios WHERE nickname = ?', [usuario_nickname]);
    if (usuarioRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el logro existe
    const [logroRows] = await connection.query('SELECT idlogros FROM logros WHERE idlogros = ?', [logro_id]);
    if (logroRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Logro no encontrado'
      });
    }

    // Verificar que no se haya asignado ya
    const [existingRows] = await connection.query(
      'SELECT id FROM usuario_logros WHERE usuario_nickname = ? AND logro_id = ?',
      [usuario_nickname, logro_id]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya tiene este logro asignado'
      });
    }

    // Asignar logro
    await connection.query(`
      INSERT INTO usuario_logros (usuario_nickname, logro_id, asignado_por)
      VALUES (?, ?, ?)
    `, [usuario_nickname, logro_id, req.usuario?.nickname || 'admin']);

    res.status(201).json({
      success: true,
      message: 'Logro asignado correctamente'
    });
  } catch (error) {
    console.error('Error al asignar logro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar logro de usuario
export const eliminarLogroUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await connection.query('DELETE FROM usuario_logros WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Logro de usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Logro eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar logro de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener comodines de usuarios
export const getUsuarioComodines = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT uc.*, 
             c.nombre as comodin_nombre, 
             c.foto as comodin_foto
      FROM usuario_comodines uc
      JOIN comodines c ON uc.comodin_id = c.idcomodines
      ORDER BY uc.fecha_obtencion DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener comodines de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar comodín de usuario
export const eliminarComodinUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await connection.query('DELETE FROM usuario_comodines WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comodín de usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Comodín eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar comodín de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener logros y comodines de un usuario específico
export const getUsuarioLogrosComodines = async (req, res) => {
  try {
    const { nickname } = req.params;

    // Obtener logros del usuario
    const [logrosRows] = await connection.query(`
      SELECT ul.*, 
             l.nombre as logro_nombre, 
             l.foto as logro_foto
      FROM usuario_logros ul
      JOIN logros l ON ul.logro_id = l.idlogros
      WHERE ul.usuario_nickname = ?
      ORDER BY ul.fecha_obtencion DESC
    `, [nickname]);

    // Obtener comodines del usuario
    const [comodinesRows] = await connection.query(`
      SELECT uc.*, 
             c.nombre as comodin_nombre, 
             c.foto as comodin_foto
      FROM usuario_comodines uc
      JOIN comodines c ON uc.comodin_id = c.idcomodines
      WHERE uc.usuario_nickname = ?
      ORDER BY uc.fecha_obtencion DESC
    `, [nickname]);

    res.json({
      success: true,
      data: {
        logros: logrosRows,
        comodines: comodinesRows
      }
    });
  } catch (error) {
    console.error('Error al obtener logros y comodines del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}; 