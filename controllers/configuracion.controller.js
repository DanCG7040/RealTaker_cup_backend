import connection from '../db.js';

export const getConfiguracionInicio = async (req, res) => {
  try {
    const [rows] = await connection.query(
      'SELECT * FROM configuracion_inicio WHERE id = 1'
    );
    
    let configuracion;
    if (rows.length === 0 || !rows[0].orden_secciones) {
      // Configuración por defecto
      const defaultOrden = ['novedades', 'tablaGeneral', 'jugadores', 'juegos', 'comodines', 'ruleta'];
      configuracion = {
        mostrarTablaGeneral: true,
        ordenSecciones: defaultOrden
      };
      
      // Insertar configuración por defecto si no existe
      if (rows.length === 0) {
        await connection.query(
          'INSERT INTO configuracion_inicio (id, mostrar_tabla_general, orden_secciones) VALUES (1, ?, ?)',
          [configuracion.mostrarTablaGeneral, JSON.stringify(defaultOrden)]
        );
      } else {
          await connection.query(
          'UPDATE configuracion_inicio SET orden_secciones = ? WHERE id = 1',
          [JSON.stringify(defaultOrden)]
        );
      }

    } else {
      configuracion = {
        mostrarTablaGeneral: rows[0].mostrar_tabla_general === 1,
        ordenSecciones: JSON.parse(rows[0].orden_secciones)
      };
    }
    
    res.json({
      success: true,
      data: configuracion
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const updateConfiguracionInicio = async (req, res) => {
  try {
    const { mostrarTablaGeneral, ordenSecciones } = req.body;
    
    const [result] = await connection.query(
      'UPDATE configuracion_inicio SET mostrar_tabla_general = ?, orden_secciones = ? WHERE id = 1',
      [mostrarTablaGeneral ? 1 : 0, JSON.stringify(ordenSecciones)]
    );

    if (result.affectedRows === 0) {
      // Si no existe, crear
      await connection.query(
        'INSERT INTO configuracion_inicio (id, mostrar_tabla_general, orden_secciones) VALUES (1, ?, ?)',
        [mostrarTablaGeneral ? 1 : 0, JSON.stringify(ordenSecciones)]
      );
    }

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}; 