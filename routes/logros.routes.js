import express from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import {
    getAllLogros,
    getLogroById,
    createLogro,
    updateLogro,
    deleteLogro
} from '../controllers/logros.controller.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllLogros);
router.get('/:idLogros', getLogroById);

// Rutas protegidas (requieren autenticación)
router.post('/', verificarToken, upload.single('foto'), createLogro);
router.put('/:idLogros', verificarToken, upload.single('foto'), updateLogro);
router.delete('/:idLogros', verificarToken, deleteLogro);

export default router; 