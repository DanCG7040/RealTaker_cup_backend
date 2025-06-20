import express from 'express';
import * as configuracionController from '../controllers/configuracion.controller.js';
import { verificarToken, verificarAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rutas para configuración
router.get('/inicio', configuracionController.getConfiguracionInicio);
router.put('/inicio', verificarToken, verificarAdmin, configuracionController.updateConfiguracionInicio);

export default router; 