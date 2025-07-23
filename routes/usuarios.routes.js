import express from 'express';
import {
  getUsuarioLogros,
  asignarLogroUsuario,
  eliminarLogroUsuario,
  getUsuarioComodines,
  eliminarComodinUsuario,
  getUsuarioLogrosComodines,
  getUsuariosConTwitch,
  getUsuariosConTwitchEnVivo
} from '../controllers/usuarios.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

// Rutas para logros de usuarios (solo admin)
router.get('/logros', verifyToken, checkRole([0]), getUsuarioLogros);
router.post('/logros', verifyToken, checkRole([0]), asignarLogroUsuario);
router.delete('/logros/:id', verifyToken, checkRole([0]), eliminarLogroUsuario);

// Rutas para comodines de usuarios (solo admin)
router.get('/comodines', verifyToken, checkRole([0]), getUsuarioComodines);
router.delete('/comodines/:id', verifyToken, checkRole([0]), eliminarComodinUsuario);

// Ruta para obtener logros y comodines de un usuario específico (público)
router.get('/:nickname/logros-comodines', getUsuarioLogrosComodines);
router.get('/twitch', getUsuariosConTwitch);
router.get('/twitch-en-vivo', getUsuariosConTwitchEnVivo);

export default router; 