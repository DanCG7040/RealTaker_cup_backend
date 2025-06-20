import express from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import {
    getAllJuegos,
    getJuegoById,
    createJuego,
    updateJuego,
    deleteJuego,
    toggleVisibilidadJuego,
    getJuegosInicio
} from '../controllers/juegos.controller.js';
import { uploadJuegos } from '../config/cloudinary.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllJuegos);
router.get('/inicio', getJuegosInicio);
router.get('/:id', getJuegoById);

// Rutas protegidas (requieren autenticación)
router.post('/', verificarToken, uploadJuegos.single('foto'), createJuego);
router.put('/:id', verificarToken, uploadJuegos.single('foto'), updateJuego);
router.put('/:id/visibilidad', verificarToken, toggleVisibilidadJuego);
router.delete('/:id', verificarToken, deleteJuego);

export default router; 