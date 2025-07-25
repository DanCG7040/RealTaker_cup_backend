import connection from "../db.js";
import jwt from "jsonwebtoken";
import { cloudinary } from "../config/cloudinary.js";
import nodemailer from 'nodemailer';

export const actualizarPerfil = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.SECRET);
      const nickname = decoded.nickname;

      // Verificar que el usuario existe
      const [rows] = await connection.query('SELECT * FROM usuarios WHERE nickname = ?', [nickname]);
      if (rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }

      // Obtener datos del formulario
      const { email, descripcion } = req.body;
      let fotoURL = rows[0].foto;

      // Procesar imagen si fue enviada
      if (req.file) {
          try {
              // Si ya existe una foto anterior y no es la default, eliminarla de Cloudinary
              if (rows[0].foto && !rows[0].foto.includes('default-profile')) {
                  const publicId = rows[0].foto.split('/').pop().split('.')[0];
                  await cloudinary.uploader.destroy(`perfiles/${publicId}`);
              }
              
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

      // Actualizar datos
      const updateData = { email, descripcion, foto: fotoURL };
      await connection.query('UPDATE usuarios SET ? WHERE nickname = ?', [updateData, nickname]);

      const [updatedRows] = await connection.query(
          'SELECT nickname, email, foto, descripcion, rol FROM usuarios WHERE nickname = ?', 
          [nickname]
      );

      return res.status(200).json({ 
          success: true,
          data: updatedRows[0]
      });

  } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return res.status(500).json({ 
          success: false,
          error: 'Error al actualizar perfil'
      });
  }
};

export const obtenerPerfil = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Token no proporcionado o inválido' 
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET);
    
    const [rows] = await connection.query(
      'SELECT nickname, email, foto, descripcion, rol FROM usuarios WHERE nickname = ?', 
      [decoded.nickname]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error en obtenerPerfil:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const actualizarUsuarioAdmin = async (req, res) => {
    const { nicknameObjetivo } = req.params;
    const { email, foto, descripcion, rol } = req.body;
  
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado' });
    }
  
    const token = authHeader.split(' ')[1];
  
    try {
      const decoded = jwt.verify(token, process.env.SECRET);
  
      if (decoded.rol !== 0) {
        return res.status(403).json({ message: 'Solo los administradores pueden actualizar otros usuarios' });
      }
  
      const [rows] = await connection.query('SELECT * FROM usuarios WHERE nickname = ?', [nicknameObjetivo]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Usuario a actualizar no encontrado' });
      }
  
      const campos = [];
      const valores = [];
  
      if (email) {
        campos.push('email = ?');
        valores.push(email);
      }
  
      if (foto) {
        campos.push('foto = ?');
        valores.push(foto);
      }
  
      if (descripcion) {
        campos.push('descripcion = ?');
        valores.push(descripcion);
      }
  
      if (rol !== undefined) {
        campos.push('rol = ?');
        valores.push(rol);
      }
  
      if (campos.length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' });
      }
  
      const query = `UPDATE usuarios SET ${campos.join(', ')} WHERE nickname = ?`;
      valores.push(nicknameObjetivo);
  
      await connection.query(query, valores);
  
      return res.status(200).json({ message: 'Usuario actualizado exitosamente' });
  
    } catch (error) {
      console.error('Error al actualizar usuario por admin:', error);
      return res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

export const eliminarUsuarioAdmin = async (req, res) => {
    const { nicknameObjetivo } = req.params;
  
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado' });
    }
  
    const token = authHeader.split(' ')[1];
  
    try {
      const decoded = jwt.verify(token, process.env.SECRET);
  
      if (decoded.rol !== 0) {
        return res.status(403).json({ message: 'Solo los administradores pueden eliminar usuarios' });
      }
  
      const [rows] = await connection.query('SELECT * FROM usuarios WHERE nickname = ?', [nicknameObjetivo]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      await connection.query('DELETE FROM usuarios WHERE nickname = ?', [nicknameObjetivo]);
  
      return res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};

export const obtenerTodosUsuarios = async (req, res) => {
    console.log('📝 Iniciando obtenerTodosUsuarios');
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            error: 'No autorizado' 
        });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET);

        if (!decoded.rol && decoded.rol !== 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Token inválido: falta información del rol' 
            });
        }

        if (decoded.rol !== 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Solo los administradores pueden ver todos los usuarios' 
            });
        }

        const [rows] = await connection.query(
            'SELECT nickname, email, rol FROM usuarios'
        );

        return res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error en obtenerTodosUsuarios:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado'
            });
        }
        
        return res.status(500).json({
            success: false,
            error: 'Error al obtener usuarios'
        });
    }
};

export const updateTwitchChannel = async (req, res) => {
    try {
        // Puedes obtener el nickname del usuario autenticado o del body
        const { nickname } = req.user || req.body;
        const { twitch_channel } = req.body;

        if (!twitch_channel) {
            return res.status(400).json({ success: false, message: 'El canal de Twitch es requerido' });
        }

        await connection.query(
            'UPDATE usuarios SET twitch_channel = ? WHERE nickname = ?',
            [twitch_channel, nickname]
        );

        return res.json({ success: true, message: 'Canal de Twitch actualizado' });
    } catch (error) {
        console.error('Error al actualizar canal de Twitch:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const solicitarJugador = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET);
    const nickname = decoded.nickname;
    const { nombre, celular } = req.body;
    if (!nombre || !celular) {
      return res.status(400).json({ message: 'Nombre y celular son requeridos' });
    }
    // Obtener email del usuario (ya no se usará para enviar el correo, pero puede ser útil para el admin)
    const [rows] = await connection.query('SELECT email FROM usuarios WHERE nickname = ?', [nickname]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const email = rows[0].email;
    // Cambiar rol a 2 (jugador)
    await connection.query('UPDATE usuarios SET rol = 2 WHERE nickname = ?', [nickname]);
    // Enviar correo al correo de la Takercup (admin)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER, // Ahora el destinatario es el correo de la Takercup
      subject: 'Nueva solicitud de jugador en Takercup',
      text: `Se ha recibido una nueva solicitud para participar como jugador.\n\nDatos del usuario:\n- Nickname: ${nickname}\n- Nombre completo: ${nombre}\n- Celular: ${celular}\n- Email registrado: ${email}`
    });
    return res.status(200).json({ message: 'Rol actualizado a jugador y correo enviado al admin' });
  } catch (error) {
    console.error('Error en solicitarJugador:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};
  