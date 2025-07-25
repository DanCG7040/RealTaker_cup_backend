import express from 'express';
import { uploadPerfiles } from '../config/cloudinary.js';
import { actualizarPerfil, obtenerPerfil, actualizarUsuarioAdmin, eliminarUsuarioAdmin, obtenerTodosUsuarios, updateTwitchChannel, solicitarJugador } from '../controllers/perfil.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { checkAdminRole } from '../middlewares/roleCheck.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Perfil
 *   description: Gestión de perfiles de usuario
 */

// Rutas públicas del perfil
router.get('/', verificarToken, obtenerPerfil);
router.put('/', verificarToken, uploadPerfiles.single('foto'), actualizarPerfil);
router.put('/twitch', updateTwitchChannel);

// Rutas de administrador
router.use('/admin', verificarToken, checkAdminRole);
router.get('/admin/usuarios', obtenerTodosUsuarios);
router.post('/admin/crear', actualizarUsuarioAdmin);
router.put('/admin/actualizar/:nicknameObjetivo', actualizarUsuarioAdmin);
router.delete('/admin/eliminar/:nicknameObjetivo', eliminarUsuarioAdmin);
router.put('/admin/rol', actualizarUsuarioAdmin);
router.post('/solicitar-jugador', solicitarJugador);

export default router;