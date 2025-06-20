import express from 'express';
import * as torneoController from '../controllers/torneo.controller.js';

const router = express.Router();

// Rutas para torneo
router.get('/jugadores', torneoController.getJugadoresTorneo);

// Rutas para jugadores del inicio
router.get('/jugadores-inicio', torneoController.getJugadoresInicio);
router.post('/jugadores-inicio', torneoController.setJugadoresInicio);

export default router; 