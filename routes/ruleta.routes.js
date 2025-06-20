import express from 'express';
import {
  getRuletaItems,
  createRuletaItem,
  updateRuletaItem,
  deleteRuletaItem,
  getRuletaConfiguracion,
  updateRuletaConfiguracion,
  girarRuleta
} from '../controllers/ruleta.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Rutas para configuración (deben ir antes de las rutas con parámetros)
router.get('/configuracion', verifyToken, checkRole([0]), getRuletaConfiguracion);
router.put('/configuracion', verifyToken, checkRole([0]), updateRuletaConfiguracion);

// Ruta pública para verificar estado de ruleta (sin autenticación)
router.get('/estado', getRuletaConfiguracion);

// Ruta para jugadores (girar ruleta)
router.post('/girar', verifyToken, checkRole([2]), girarRuleta);

// Rutas para administradores (con parámetros)
router.get('/', verifyToken, checkRole([0]), getRuletaItems);
router.post('/', verifyToken, checkRole([0]), upload.single('imagen'), createRuletaItem);
router.put('/:id', verifyToken, checkRole([0]), upload.single('imagen'), updateRuletaItem);
router.delete('/:id', verifyToken, checkRole([0]), deleteRuletaItem);

export default router; 