import express from 'express';
import { 
    getAllLogros, 
    getLogroById, 
    createLogro, 
    updateLogro, 
    deleteLogro,
    getLogrosDestacados
} from '../controllers/logros.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllLogros);
router.get('/destacados', getLogrosDestacados);
router.get('/:idLogros', getLogroById);

// Rutas protegidas (solo administradores)
router.post('/', verifyToken, checkRole([0]), upload.single('foto'), createLogro);
router.put('/:idLogros', verifyToken, checkRole([0]), upload.single('foto'), updateLogro);
router.delete('/:idLogros', verifyToken, checkRole([0]), deleteLogro);

export default router; 