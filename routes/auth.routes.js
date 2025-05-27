import { Router } from 'express';
import { registrarUsuario, loginUsuario, olvideMiContrasena, restablecerContrasena } from '../controllers/auth.controller.js';

const router = Router();

// Ruta para registrar usuario
router.post('/register', registrarUsuario);

// Ruta para logear usuario
router.post('/login', loginUsuario);

// Ruta para olvidé mi contraseña
router.post('/forgot-password', olvideMiContrasena);

// Ruta para restablecer contraseña
router.post('/reset-password', restablecerContrasena);

export default router;
