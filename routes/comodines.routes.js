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
import { verifyToken, checkRole } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Ruta pública para obtener todos los comodines
router.get('/todos', getAllComodines);

// Rutas protegidas para administradores
router.get('/', verifyToken, checkRole([0]), getAllComodines);
router.get('/:idComodines', verifyToken, checkRole([0]), getComodinById);
router.post('/', verifyToken, checkRole([0]), upload.single('foto'), createComodin);
router.put('/:idComodines', verifyToken, checkRole([0]), upload.single('foto'), updateComodin);
router.delete('/:idComodines', verifyToken, checkRole([0]), deleteComodin);

// Rutas protegidas (requieren autenticación y permisos de administrador)
router.post('/', verificarToken, verificarAdmin, uploadComodines.single('foto'), createComodin);
router.put('/:idComodines', verificarToken, verificarAdmin, uploadComodines.single('foto'), updateComodin);
router.delete('/:idComodines', verificarToken, verificarAdmin, deleteComodin);

export default router; 