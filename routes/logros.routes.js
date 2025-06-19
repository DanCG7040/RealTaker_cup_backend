import express from 'express';
import { verificarToken, verificarAdmin } from '../middlewares/auth.middleware.js';
import {
    getAllLogros,
    getLogroById,
    createLogro,
    updateLogro,
    deleteLogro
} from '../controllers/logros.controller.js';
import { uploadLogros } from '../config/cloudinary.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllLogros);
router.get('/:idLogros', getLogroById);

// Rutas protegidas (requieren autenticación y permisos de administrador)
router.post('/', verificarToken, verificarAdmin, uploadLogros.single('foto'), createLogro);
router.put('/:idLogros', verificarToken, verificarAdmin, uploadLogros.single('foto'), updateLogro);
router.delete('/:idLogros', verificarToken, verificarAdmin, deleteLogro);

export default router; 