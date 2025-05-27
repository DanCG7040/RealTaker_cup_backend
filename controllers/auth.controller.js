import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import connection from '../db.js';

export const registrarUsuario = async (req, res) => {
  const { nickname, password, email } = req.body;

  // Validar que nickname no esté vacío
  if (!nickname || !nickname.trim()) {
    return res.status(400).json({ message: 'El nickname es obligatorio' });
  }

  // Validar que password no esté vacío
  if (!password || !password.trim()) {
    return res.status(400).json({ message: 'La contraseña es obligatoria' });
  }

  // Validar que email no esté vacío
  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'El correo es obligatorio' });
  }

  // Validar que la contraseña sea fuerte (mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial)
  const passwordStrength = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordStrength.test(password)) {
    return res.status(400).json({
      message: 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial'
    });
  }

  try {
    // Verificar que nickname no exista
    const [userNick] = await connection.query('SELECT * FROM usuarios WHERE nickname = ?', [nickname]);
    if (userNick.length > 0) {
      return res.status(400).json({ message: 'El nickname ya existe' });
    }

    // Verificar que email no exista
    const [userEmail] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (userEmail.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar usuario
    await connection.query(
      'INSERT INTO usuarios (nickname, password, email, rol) VALUES (?, ?, ?, ?)',
      [nickname, passwordHash, email, 1]
    );

    // Generar token
    const token = jwt.sign(
      { nickname },
      process.env.SECRET,
      { expiresIn: '2h' }
    );

    return res.status(201).json({ 
      message: 'Usuario registrado correctamente', 
      token 
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

export const loginUsuario = async (req, res) => {
  const { nickname, password } = req.body;

  // Validar que nickname no esté vacío
  if (!nickname || !nickname.trim()) {
    return res.status(400).json({ message: 'El nickname es obligatorio' });
  }

  // Validar que password no esté vacío
  if (!password || !password.trim()) {
    return res.status(400).json({ message: 'La contraseña es obligatoria' });
  }

  try {
    // Buscar usuario por nickname
    const [rows] = await connection.query('SELECT * FROM usuarios WHERE nickname = ?', [nickname]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const usuario = rows[0];

    // Comparar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    const rol = usuario.rol; // esto viene de la base de datos

    const token = jwt.sign(
      { nickname: usuario.nickname, rol: rol }, // 👈 asegúrate de incluir rol aquí
      process.env.SECRET,
      { expiresIn: '2h' }
    );
    

    return res.status(200).json({
      message: 'Login exitoso',
      token
    });

  } catch (error) {
    console.error('Error al hacer login:', error);
    return res.status(500).json({ message: 'Error al hacer login' });
  }
};

export const olvideMiContrasena = async (req, res) => {
  console.log('📧 Iniciando proceso de recuperación de contraseña');
  console.log('📧 Email recibido:', req.body.email);
  
  const { email } = req.body;

  // Validar que email no esté vacío
  if (!email || !email.trim()) {
    console.log('❌ Email vacío');
    return res.status(400).json({ message: 'El correo es obligatorio' });
  }

  try {
    // Verificar que el email existe
    console.log('🔍 Buscando usuario con email:', email);
    const [user] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (user.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(404).json({ message: 'No existe un usuario con ese correo electrónico' });
    }
    console.log('✅ Usuario encontrado');

    // Generar token de restablecimiento (expira en 1 hora)
    console.log('🔑 Generando token de restablecimiento');
    const resetToken = jwt.sign(
      { email },
      process.env.SECRET,
      { expiresIn: '1h' }
    );

    // Guardar el token en la base de datos
    console.log('💾 Guardando token en la base de datos');
    await connection.query(
      'UPDATE usuarios SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?',
      [resetToken, email]
    );

    // Configurar el transportador de correo
    console.log('📨 Configurando transportador de correo');
    console.log('   - Usuario:', process.env.MAIL_USER);
    console.log('   - Contraseña configurada:', !!process.env.EMAIL_PASSWORD);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // URL del frontend donde se procesará el cambio de contraseña
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log('🔗 URL de restablecimiento:', resetUrl);

    // Configurar el correo
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Restablecimiento de Contraseña',
      html: `
        <h1>Restablecimiento de Contraseña</h1>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}">Cambiar mi contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      `
    };

    // Enviar el correo
    console.log('📤 Enviando correo...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado exitosamente');

    return res.status(200).json({ 
      message: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico'
    });

  } catch (error) {
    console.error('❌ Error en olvideMiContrasena:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud de restablecimiento' });
  }
};

export const restablecerContrasena = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
  }

  try {
    // Verificar que el token sea válido y no haya expirado
    const [user] = await connection.query(
      'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (user.length === 0) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Validar que la contraseña sea fuerte
    const passwordStrength = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrength.test(newPassword)) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial'
      });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña y limpiar el token
    await connection.query(
      'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = ?',
      [passwordHash, token]
    );

    return res.status(200).json({ 
      message: 'Contraseña actualizada correctamente' 
    });

  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};

