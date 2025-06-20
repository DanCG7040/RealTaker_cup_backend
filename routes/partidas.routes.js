import express from 'express';
import { 
  getEdicionesActivas, 
  getJugadoresByEdicion, 
  createPartida, 
  getAllPartidas,
  getPartidaById,
  updatePartida,
  deletePartida,
  getPerfilJugador,
  registrarResultado,
  getResultado,
  limpiarTablaGeneral,
  getTablaGeneral
} from '../controllers/partidas.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/ediciones-activas', getEdicionesActivas);
router.get('/jugadores/:idEdicion', getJugadoresByEdicion);
router.get('/perfil/:nickname', getPerfilJugador);
router.get('/tabla-general', getTablaGeneral);

// Rutas protegidas
router.get('/', verifyToken, checkRole([0]), getAllPartidas);
router.get('/:id', verifyToken, checkRole([0]), getPartidaById);
router.post('/', verifyToken, checkRole([0]), createPartida);
router.put('/:id', verifyToken, checkRole([0]), updatePartida);
router.delete('/:id', verifyToken, checkRole([0]), deletePartida);
router.post('/:id/resultado', verifyToken, checkRole([0]), registrarResultado);
router.get('/:id/resultado', verifyToken, checkRole([0]), getResultado);
router.delete('/limpiar-tabla-general', verifyToken, checkRole([0]), limpiarTablaGeneral);

export default router; 