import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import authRoutes from './routes/auth.routes.js'; // Usamos las rutas correctas
import rolesRoutes from './routes/roles.routes.js'; // <- nuevo
import perfilRoutes from './routes/perfil.routes.js'; // <- nuevo
import categoriaRoutes from './routes/categoria.routes.js';
import juegosRoutes from './routes/juegos.routes.js';
import logrosRoutes from './routes/logros.routes.js';
import comodinesRoutes from './routes/comodines.routes.js';
import edicionRoutes from './routes/edicion.routes.js';
import puntosRoutes from './routes/puntos.routes.js';
import partidasRoutes from './routes/partidas.routes.js'; // <- nuevo
import connection from './db.js';
import { uploadPerfiles } from './config/cloudinary.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware para logging de peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
      puntos: '/api/puntos/*',
      partidas: '/api/partidas/*'
    }
  });
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

// Log para debugging
console.log('🚀 Rutas montadas:');
console.log('  - /api (auth)');
console.log('  - /api/rol');
console.log('  - /api/partidas');
console.log('  - /api/perfil');

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
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
  console.log('   - /api/upload (Cloudinary)');
});
