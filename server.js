import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js'; // Usamos las rutas correctas
import rolesRoutes from './routes/roles.routes.js'; // <- nuevo

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());



// Usar las rutas que ya tienes bien organizadas
app.use('/api', authRoutes); // Esto maneja /api/login y /api/register
app.use('/api/rol', rolesRoutes); // <- montas rutas protegidas
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
