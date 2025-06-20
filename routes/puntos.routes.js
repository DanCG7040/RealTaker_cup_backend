import express from 'express';
import { getAllPuntos, getPuntosByTipo, createOrUpdatePuntos, deletePuntos } from '../controllers/puntos.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Rutas para puntos por tipo de partida
// GET /api/puntos - Obtener todos los puntos
router.get('/', verifyToken, isAdmin, getAllPuntos);

// GET /api/puntos/:tipo - Obtener puntos por tipo
router.get('/:tipo', verifyToken, isAdmin, getPuntosByTipo);

// POST /api/puntos - Crear o actualizar puntos
router.post('/', verifyToken, isAdmin, createOrUpdatePuntos);

// DELETE /api/puntos/:id - Eliminar puntos por ID
router.delete('/:id', verifyToken, isAdmin, deletePuntos);

export default router; 