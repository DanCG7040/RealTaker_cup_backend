import { cloudinary } from '../config/cloudinary.js';
import { pool } from '../config/db.js';

export const updateGame = async (req, res) => {
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