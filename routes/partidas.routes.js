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
  limpiarTablaGeneral
} from '../controllers/partidas.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Rutas específicas primero (antes que las rutas con parámetros)
router.get('/ediciones-activas', getEdicionesActivas);
router.get('/jugadores/:idEdicion', getJugadoresByEdicion);
router.get('/perfil/:nickname', getPerfilJugador);

// Ruta para limpiar tabla general (solo admin)
router.delete('/limpiar-tabla-general', verifyToken, isAdmin, limpiarTablaGeneral);

// Rutas para resultados (deben ir antes que /:id)
router.post('/:id/resultado', registrarResultado);
router.get('/:id/resultado', getResultado);

// Rutas generales de partidas
router.get('/', getAllPartidas);
router.get('/:id', getPartidaById);
router.post('/', createPartida);
router.put('/:id', updatePartida);
router.delete('/:id', deletePartida);

export default router; 