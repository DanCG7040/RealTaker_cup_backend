import express from 'express';
import { verificarToken, verificarAdmin } from '../middlewares/auth.middleware.js';
import {
    createEdicion,
    getAllEdiciones,
    getEdicionById,
    updateEdicion,
    deleteEdicion,
    asignarJuegos,
    asignarJugadores,
    getJuegosByEdicion,
    getJugadoresByEdicion
} from '../controllers/edicion.controller.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllEdiciones);
router.get('/:idEdicion', getEdicionById);
router.get('/:idEdicion/juegos', getJuegosByEdicion);
router.get('/:idEdicion/jugadores', getJugadoresByEdicion);

// Rutas protegidas (requieren autenticación y permisos de administrador)
router.post('/', verificarToken, verificarAdmin, createEdicion);
router.put('/:idEdicion', verificarToken, verificarAdmin, updateEdicion);
router.delete('/:idEdicion', verificarToken, verificarAdmin, deleteEdicion);
router.post('/:idEdicion/juegos', verificarToken, verificarAdmin, asignarJuegos);
router.post('/:idEdicion/jugadores', verificarToken, verificarAdmin, asignarJugadores);

export default router; 