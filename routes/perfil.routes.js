import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import { actualizarPerfil, obtenerPerfil, actualizarUsuarioAdmin, eliminarUsuarioAdmin } from '../controllers/perfil.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { checkAdminRole } from '../middlewares/roleCheck.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Perfil
 *   description: Gestión de perfiles de usuario
 */

// Configurar multer con Cloudinary
const upload = multer({ 
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB límite
    }
}).single('foto');

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'El archivo es demasiado grande. Máximo 2MB'
            });
        }
        return res.status(400).json({
            success: false,
            error: 'Error al subir el archivo'
        });
    }
    next(err);
};

// Rutas públicas del perfil
router.get('/', verificarToken, obtenerPerfil);
router.put('/', verificarToken, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return handleMulterError(err, req, res, next);
        next();
    });
}, actualizarPerfil);

// Rutas de administrador
router.use('/admin', verificarToken, checkAdminRole);
router.post('/admin/crear', actualizarUsuarioAdmin);
router.put('/admin/actualizar/:nicknameObjetivo', actualizarUsuarioAdmin);
router.delete('/admin/eliminar/:nicknameObjetivo', eliminarUsuarioAdmin);
router.put('/admin/rol', actualizarUsuarioAdmin);

export default router;