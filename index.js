import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import authRoutes from './routes/auth.routes.js'; 
import rolesRoutes from './routes/roles.routes.js'; 
import perfilRoutes from './routes/perfil.routes.js'; 
import categoriaRoutes from './routes/categoria.routes.js';
import juegosRoutes from './routes/juegos.routes.js';
import logrosRoutes from './routes/logros.routes.js';
import comodinesRoutes from './routes/comodines.routes.js';
import edicionRoutes from './routes/edicion.routes.js';
import puntosRoutes from './routes/puntos.routes.js';
import partidasRoutes from './routes/partidas.routes.js';
import entradasRoutes from './routes/entradas.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';
import torneoRoutes from './routes/torneo.routes.js';
import ruletaRoutes from './routes/ruleta.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import historicoRoutes from './routes/historico.routes.js';
import connection from './db.js';
import videosHistoricosRoutes from './routes/videos_historicos.routes.js';

// Cargar variables de entorno
dotenv.config();

// Configurar multer con almacenamiento local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // Límite de 2MB
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para loggear todas las peticiones
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.PRODUCTION_URL // Ejemplo: https://www.takercup.com
].filter(Boolean); // Elimina los valores null/undefined

// Configuración de CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como las aplicaciones móviles o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware para parsear JSON y form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static('uploads'));

// Middleware para verificar la conexión a la base de datos
app.use(async (req, res, next) => {
  try {
    // Verificar la conexión haciendo una consulta simple
    await connection.query('SELECT 1');
    next();
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error);
    res.status(500).json({ message: 'Error de conexión a la base de datos' });
  }
});

// Rutas principales
console.log('🛣️ Configurando rutas...');

// Ruta de prueba para verificar que las rutas están funcionando
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API funcionando correctamente',
    rutas_disponibles: {
      auth: '/api/auth/*',
      roles: '/api/rol/*',
      perfil: '/api/perfil/*',
      categoria: '/api/categoria/*',
      juegos: '/api/juegos/*',
      logros: '/api/logros/*',
      comodines: '/api/comodines/*',
      edicion: '/api/edicion/*',
      puntos: '/api/puntos/*'
    }
  });
});

// Ruta para subir fotos
app.post('/api/upload', upload.single('foto'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No se ha subido ningún archivo' 
      });
    }
    
    res.json({ 
      success: true,
      url: req.file.path,
      message: 'Archivo subido correctamente'
    });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al procesar el archivo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Montar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/rol', rolesRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/categoria', categoriaRoutes);
app.use('/api/juegos', juegosRoutes);
app.use('/api/logros', logrosRoutes);
app.use('/api/comodines', comodinesRoutes);
app.use('/api/edicion', edicionRoutes);
app.use('/api/puntos', puntosRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/entradas', entradasRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/torneo', torneoRoutes);
app.use('/api/ruleta', ruletaRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/videos-historicos', videosHistoricosRoutes);

// Middleware para rutas no encontradas
app.use((req, res) => {
  console.log('❌ Ruta no encontrada:', req.url);
  res.status(404).json({ 
    success: false,
    message: 'Ruta no encontrada',
    path: req.url 
  });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Manejar errores de Multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'El archivo es demasiado grande. Máximo 2MB permitido.' 
      });
    }
    return res.status(400).json({ message: 'Error al subir el archivo' });
  }

  // Manejar errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expirado' });
  }

  // Error general
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar el servidor
const server = app.listen(PORT, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log('📁 Rutas disponibles:');
  console.log('   - /api/auth/*');
  console.log('   - /api/rol/*');
  console.log('   - /api/perfil/*');
  console.log('   - /api/categoria/*');
  console.log('   - /api/juegos/*');
  console.log('   - /api/logros/*');
  console.log('   - /api/comodines/*');
  console.log('   - /api/edicion/*');
  console.log('   - /api/puntos/*');
  console.log('   - /api/partidas/*');
  console.log('   - /api/entradas/*');
  console.log('   - /api/configuracion/*');
  console.log('   - /api/torneo/*');
  console.log('   - /api/ruleta/*');
  console.log('   - /api/usuarios/*');
  console.log('   - /api/upload (Cloudinary)');
});

// Manejar errores del servidor
server.on('error', (error) => {
  console.error('❌ Error en el servidor:', error);
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Manejar promesas rechazadas no capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa no manejada:', reason);
});
