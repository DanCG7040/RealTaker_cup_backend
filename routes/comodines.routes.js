import express from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import {
    getAllComodines,
    getComodinById,
    createComodin,
    updateComodin,
    deleteComodin
} from '../controllers/comodines.controller.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllComodines);
router.get('/:idComodines', getComodinById);

// Rutas protegidas (requieren autenticación)
router.post('/', verificarToken, upload.single('foto'), createComodin);
router.put('/:idComodines', verificarToken, upload.single('foto'), updateComodin);
router.delete('/:idComodines', verificarToken, deleteComodin);

export default router; 