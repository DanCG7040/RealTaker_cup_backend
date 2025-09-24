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
  getTablaGeneral,
  getJugadoresDestacados,
  getEstadisticasReales,
  getEstadisticasDetalladas,
  getPartidasJugador,
  getPartidaEnJuego
} from '../controllers/partidas.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

// Rutas públicas (para histórico y acceso general)
router.get('/ediciones-activas', getEdicionesActivas);
router.get('/jugadores/:idEdicion', getJugadoresByEdicion);
router.get('/perfil/:nickname', getPerfilJugador);
router.get('/tabla-general', getTablaGeneral);
router.get('/jugadores-destacados', getJugadoresDestacados);
router.get('/estadisticas-reales', getEstadisticasReales);
router.get('/estadisticas-detalladas/:nickname', getEstadisticasDetalladas);
router.get('/jugador/:nickname/partidas', getPartidasJugador);
router.get('/en-juego', getPartidaEnJuego);
router.get('/limpiar-tabla-general', verifyToken, checkRole([0]), limpiarTablaGeneral); // Ruta específica antes de /:id
router.get('/', getAllPartidas); // Público para histórico
router.get('/:id', getPartidaById); // Público para histórico
router.get('/:id/resultado', getResultado); // Público para histórico

// Rutas protegidas (solo para administradores)
router.post('/', verifyToken, checkRole([0]), createPartida);
router.put('/:id', verifyToken, checkRole([0]), updatePartida);
router.delete('/:id', verifyToken, checkRole([0]), deletePartida);
router.post('/:id/resultado', verifyToken, checkRole([0]), registrarResultado);

export default router; 