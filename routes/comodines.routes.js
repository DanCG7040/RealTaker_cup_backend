import express from 'express';
import { verificarToken, verificarAdmin } from '../middlewares/auth.middleware.js';
import {
    getAllComodines,
    getComodinById,
    createComodin,
    updateComodin,
    deleteComodin
} from '../controllers/comodines.controller.js';
import { uploadComodines } from '../config/cloudinary.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllComodines);
router.get('/:idComodines', getComodinById);

// Rutas protegidas (requieren autenticación y permisos de administrador)
router.post('/', verificarToken, verificarAdmin, uploadComodines.single('foto'), createComodin);
router.put('/:idComodines', verificarToken, verificarAdmin, uploadComodines.single('foto'), updateComodin);
router.delete('/:idComodines', verificarToken, verificarAdmin, deleteComodin);

export default router; 