import connection from '../db.js';
import axios from 'axios';
import nodemailer from 'nodemailer';

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
    const [usuarioRows] = await connection.query('SELECT nickname, email FROM usuarios WHERE nickname = ?', [usuario_nickname]);
    if (usuarioRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    const usuarioEmail = usuarioRows[0].email;

    // Verificar que el logro existe
    const [logroRows] = await connection.query('SELECT idlogros, nombre FROM logros WHERE idlogros = ?', [logro_id]);
    if (logroRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Logro no encontrado'
      });
    }
    const logroNombre = logroRows[0].nombre;

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

    // Notificar por correo
    await notificarLogroDesbloqueado(usuario_nickname, logroNombre, usuarioEmail);

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

export const getUsuariosConTwitch = async (req, res) => {
    try {
        const [usuarios] = await connection.query(
            "SELECT nickname, foto, descripcion, twitch_channel FROM usuarios WHERE twitch_channel IS NOT NULL AND twitch_channel != ''"
        );
        return res.json({ success: true, data: usuarios });
    } catch (error) {
        console.error('Error al obtener usuarios con Twitch:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}; 

const TWITCH_CLIENT_ID = '941uvt4ow3833t86mclxrnzk4r7kt8';
const TWITCH_ACCESS_TOKEN = 'orjge1vxafxilu3ljpz7ck151e701f';

export const getUsuariosConTwitchEnVivo = async (req, res) => {
  try {
    const [usuarios] = await connection.query(
      "SELECT nickname, foto, descripcion, twitch_channel FROM usuarios WHERE twitch_channel IS NOT NULL AND twitch_channel != ''"
    );

    // Consultar Twitch para cada canal
    const canales = usuarios.map(u => u.twitch_channel);
    const canalesEnVivo = [];

    for (const canal of canales) {
      const response = await axios.get(
        `https://api.twitch.tv/helix/streams?user_login=${canal}`,
        {
          headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${TWITCH_ACCESS_TOKEN}`
          }
        }
      );
      if (response.data.data && response.data.data.length > 0) {
        // El canal está en vivo
        const usuario = usuarios.find(u => u.twitch_channel === canal);
        canalesEnVivo.push(usuario);
      }
    }

    return res.json({ success: true, data: canalesEnVivo });
  } catch (error) {
    console.error('Error al obtener canales en vivo:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}; 

// Obtener todos los canales de Twitch registrados (para administración)
export const getAllTwitchChannels = async (req, res) => {
  try {
    const [usuarios] = await connection.query(
      `SELECT nickname, twitch_channel, twitch_activo FROM usuarios WHERE twitch_channel IS NOT NULL AND twitch_channel != ''`
    );
    res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Error al obtener todos los canales de Twitch:', error);
    res.status(500).json({ success: false, message: 'Error al obtener canales de Twitch' });
  }
}; 

export const toggleTwitchActivo = async (req, res) => {
  const { nickname } = req.params;
  try {
    // Verificar si el usuario existe
    const [usuarios] = await connection.query(
      'SELECT * FROM usuarios WHERE nickname = ?', [nickname]
    );
    if (usuarios.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    // Alternar el valor actual de twitch_activo
    const actual = usuarios[0].twitch_activo === 1 ? 0 : 1;
    await connection.query(
      'UPDATE usuarios SET twitch_activo = ? WHERE nickname = ?', [actual, nickname]
    );
    return res.json({ success: true, message: 'Canal de Twitch actualizado', twitch_activo: actual });
  } catch (error) {
    console.error('Error al activar/desactivar canal de Twitch:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}; 

// Usar un comodín de usuario
export const usarComodinUsuario = async (req, res) => {
  const { usuario_nickname, comodin_id } = req.body;
  if (!usuario_nickname || !comodin_id) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
  }
  try {
    // Verificar que el usuario tenga el comodín y que no esté usado
    const [rows] = await connection.query(
      'SELECT uc.*, u.email, c.nombre as comodin_nombre FROM usuario_comodines uc JOIN usuarios u ON uc.usuario_nickname = u.nickname JOIN comodines c ON uc.comodin_id = c.idcomodines WHERE uc.usuario_nickname = ? AND uc.comodin_id = ? AND uc.usado = 0',
      [usuario_nickname, comodin_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comodín no disponible o ya usado' });
    }
    const comodin = rows[0];
    // Marcar como usado
    await connection.query('UPDATE usuario_comodines SET usado = 1 WHERE id = ?', [comodin.id]);

    // Configurar nodemailer usando variables de entorno
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Correo para el admin
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: `Comodín usado por ${usuario_nickname}`,
      text: `El jugador ${usuario_nickname} ha usado el comodín: ${comodin.comodin_nombre}`
    });
    // Correo para el jugador
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: comodin.email,
      subject: 'Has usado un comodín',
      text: `Has usado el comodín: ${comodin.comodin_nombre}. ¡Recuerda que ya no está disponible!`
    });

    return res.json({ success: true, message: 'Comodín usado correctamente y correos enviados' });
  } catch (error) {
    console.error('Error al usar comodín:', error);
    res.status(500).json({ success: false, message: 'Error interno al usar comodín' });
  }
}; 

// Notificar por correo cuando se desbloquea un logro
export const notificarLogroDesbloqueado = async (usuario_nickname, logro_nombre, email) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: '¡Has desbloqueado un logro!',
      text: `¡Felicidades ${usuario_nickname}! Has desbloqueado el logro: ${logro_nombre}`
    });
  } catch (error) {
    console.error('Error al enviar correo de logro desbloqueado:', error);
  }
}; 

import transporter from '../config/mail.js';

export const enviarParticipacion = async (req, res) => {
  try {
    const { nombre, telefono, consola, nickname, email } = req.body;
    if (!nombre || !telefono || !consola || !nickname || !email) {
      return res.status(400).json({ success: false, message: 'Faltan datos' });
    }
    // Obtener correos de todos los administradores (rol 0)
    const [admins] = await connection.query('SELECT email FROM usuarios WHERE rol = 0');
    const adminEmails = admins.map(a => a.email).filter(e => !!e);
    if (adminEmails.length === 0) {
      return res.status(500).json({ success: false, message: 'No hay administradores para notificar' });
    }
    // Enviar correo a todos los admins en copia
    await transporter.sendMail({
      from: process.env.MAIL_USER || 'tucorreo@gmail.com',
      to: process.env.MAIL_USER || 'tucorreo@gmail.com', // destinatario principal (puede ser el sistema)
      cc: adminEmails, // copia a todos los admins
      subject: 'Nueva solicitud de participación',
      html: `<h2>Solicitud de participación</h2>
        <p><b>Nombre:</b> ${nombre}</p>
        <p><b>Teléfono:</b> ${telefono}</p>
        <p><b>Consola:</b> ${consola}</p>
        <p><b>Nickname:</b> ${nickname}</p>
        <p><b>Email:</b> ${email}</p>`
    });
    // Actualizar el rol del usuario a 2 (jugador)
    await connection.query('UPDATE usuarios SET rol = 2 WHERE nickname = ?', [nickname]);
    res.json({ success: true, message: 'Correo enviado y rol actualizado a jugador' });
  } catch (err) {
    console.error('Error en enviarParticipacion:', err); // Mostrar error real en consola
    res.status(500).json({ success: false, message: 'Error al enviar correo', error: err.message });
  }
};

// Obtener información completa del jugador para mini panel
export const getInformacionCompletaJugador = async (req, res) => {
  try {
    const { nickname } = req.params;
    
    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: 'Nickname es requerido'
      });
    }

    // Obtener información básica del jugador
    const [jugadorRows] = await connection.query(`
      SELECT 
        u.nickname,
        u.foto,
        u.descripcion,
        u.twitch_channel,
        u.twitch_activo
      FROM usuarios u
      WHERE u.nickname = ? AND u.rol = 2
    `, [nickname]);

    if (jugadorRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jugador no encontrado'
      });
    }

    const jugador = jugadorRows[0];

    // Obtener estadísticas generales del jugador
    const [estadisticasRows] = await connection.query(`
      SELECT 
        COUNT(DISTINCT tp.idEdicion) as ediciones_participadas,
        SUM(tg.partidas_ganadas) as total_victorias,
        SUM(tg.partidas_jugadas) as total_partidas,
        SUM(tg.puntos_totales) as total_puntos,
        ROUND(
          (SUM(tg.partidas_ganadas) / NULLIF(SUM(tg.partidas_jugadas), 0)) * 100, 2
        ) as porcentaje_victorias
      FROM usuarios u
      LEFT JOIN torneo_participantes tp ON u.nickname = tp.jugador_nickname
      LEFT JOIN tabla_general tg ON u.nickname = tg.jugador_nickname
      WHERE u.nickname = ?
      GROUP BY u.nickname
    `, [nickname]);

    // Obtener logros recientes (últimos 3)
    const [logrosRows] = await connection.query(`
      SELECT 
        ul.fecha_obtencion,
        l.nombre as logro_nombre,
        l.foto as logro_foto
      FROM usuario_logros ul
      JOIN logros l ON ul.logro_id = l.idlogros
      WHERE ul.usuario_nickname = ?
      ORDER BY ul.fecha_obtencion DESC
      LIMIT 3
    `, [nickname]);

    // Obtener comodines activos (no usados)
    const [comodinesRows] = await connection.query(`
      SELECT 
        uc.fecha_obtencion,
        c.nombre as comodin_nombre,
        c.foto as comodin_foto
      FROM usuario_comodines uc
      JOIN comodines c ON uc.comodin_id = c.idcomodines
      WHERE uc.usuario_nickname = ? AND uc.usado = 0
      ORDER BY uc.fecha_obtencion DESC
      LIMIT 3
    `, [nickname]);

    // Obtener posición en tabla general actual
    const [posicionRows] = await connection.query(`
      SELECT 
        tg.puntos_totales,
        tg.partidas_jugadas,
        tg.partidas_ganadas,
        (
          SELECT COUNT(*) + 1 
          FROM tabla_general tg2 
          WHERE tg2.puntos_totales > tg.puntos_totales 
          AND tg2.idEdicion = tg.idEdicion
        ) as posicion
      FROM tabla_general tg
      INNER JOIN (
        SELECT idEdicion FROM edicion ORDER BY idEdicion DESC LIMIT 1
      ) e ON tg.idEdicion = e.idEdicion
      WHERE tg.jugador_nickname = ?
    `, [nickname]);

    // Obtener último logro obtenido
    const [ultimoLogroRows] = await connection.query(`
      SELECT 
        l.nombre as logro_nombre,
        l.foto as logro_foto,
        ul.fecha_obtencion
      FROM usuario_logros ul
      JOIN logros l ON ul.logro_id = l.idlogros
      WHERE ul.usuario_nickname = ?
      ORDER BY ul.fecha_obtencion DESC
      LIMIT 1
    `, [nickname]);

    const estadisticas = estadisticasRows[0] || {
      ediciones_participadas: 0,
      total_victorias: 0,
      total_partidas: 0,
      total_puntos: 0,
      porcentaje_victorias: 0
    };

    const posicionActual = posicionRows[0] || null;

    res.json({
      success: true,
      data: {
        jugador: {
          nickname: jugador.nickname,
          foto: jugador.foto,
          descripcion: jugador.descripcion,
          twitch_channel: jugador.twitch_channel,
          twitch_activo: jugador.twitch_activo
        },
        estadisticas: estadisticas,
        posicion_actual: posicionActual,
        logros_recientes: logrosRows,
        comodines_activos: comodinesRows,
        ultimo_logro: ultimoLogroRows[0] || null
      }
    });
  } catch (error) {
    console.error('Error al obtener información completa del jugador:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}; 