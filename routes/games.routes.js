import { Router } from 'express';
import { upload } from '../config/cloudinary.js';
import { updateGame } from '../controllers/games.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta para actualizar un juego
router.put('/:id', verifyToken, upload.single('foto'), updateGame);

export default router; 