import express from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import {
    getAllJuegos,
    getJuegoById,
    createJuego,
    updateJuego,
    deleteJuego
} from '../controllers/juegos.controller.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllJuegos);
router.get('/:id', getJuegoById);

// Rutas protegidas (requieren autenticación)
router.post('/', verificarToken, upload.single('foto'), createJuego);
router.put('/:id', verificarToken, upload.single('foto'), updateJuego);
router.delete('/:id', verificarToken, deleteJuego);

export default router; 