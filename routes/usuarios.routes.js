import express from 'express';
import {
  getUsuarioLogros,
  asignarLogroUsuario,
  eliminarLogroUsuario,
  getUsuarioComodines,
  eliminarComodinUsuario,
  getUsuarioLogrosComodines,
  getUsuariosConTwitch,
  getUsuariosConTwitchEnVivo,
  getAllTwitchChannels,
  toggleTwitchActivo,
  usarComodinUsuario,
  notificarLogroDesbloqueado,
  enviarParticipacion,
  getInformacionCompletaJugador
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
router.post('/usar-comodin', usarComodinUsuario);

// Ruta para obtener logros y comodines de un usuario específico (público)
router.get('/:nickname/logros-comodines', getUsuarioLogrosComodines);
// Ruta para obtener información completa del jugador (público)
router.get('/:nickname/informacion-completa', getInformacionCompletaJugador);
router.get('/twitch', getUsuariosConTwitch);
router.get('/twitch-en-vivo', getUsuariosConTwitchEnVivo);
router.get('/twitch-todos', getAllTwitchChannels);
router.put('/twitch-activar/:nickname', toggleTwitchActivo);
router.post('/enviar-participacion', enviarParticipacion);

export default router; 