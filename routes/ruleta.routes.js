import express from 'express';
import {
  getRuletaItems,
  createRuletaItem,
  updateRuletaItem,
  deleteRuletaItem,
  getRuletaConfiguracion,
  updateRuletaConfiguracion,
  girarRuleta,
  getHistorialGiros,
  getEstadisticasGiros
} from '../controllers/ruleta.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Rutas para configuración (deben ir antes de las rutas con parámetros)
router.get('/configuracion', verifyToken, checkRole([0]), getRuletaConfiguracion);
router.put('/configuracion', verifyToken, checkRole([0]), updateRuletaConfiguracion);

// Ruta pública para verificar estado de ruleta (sin autenticación)
router.get('/estado', getRuletaConfiguracion);

// Rutas para jugadores y administradores (girar ruleta, historial, estadísticas)
router.post('/girar', verifyToken, checkRole([0, 2]), girarRuleta);
router.get('/historial', verifyToken, checkRole([0, 2]), getHistorialGiros);
router.get('/estadisticas', verifyToken, checkRole([0, 2]), getEstadisticasGiros);

// Rutas para administradores (con parámetros)
router.get('/', verifyToken, checkRole([0]), getRuletaItems);
router.post('/', verifyToken, checkRole([0]), createRuletaItem);
router.put('/:id', verifyToken, checkRole([0]), updateRuletaItem);
router.delete('/:id', verifyToken, checkRole([0]), deleteRuletaItem);

export default router; 