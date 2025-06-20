import express from 'express';
import * as entradasController from '../controllers/entradas.controller.js';
import { verificarToken, verificarAdmin } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Rutas para entradas
router.get('/', entradasController.getAll);
router.post('/', verificarToken, verificarAdmin, upload.single('imagen'), entradasController.create);
router.put('/:id', verificarToken, verificarAdmin, upload.single('imagen'), entradasController.update);
router.delete('/:id', verificarToken, verificarAdmin, entradasController.deleteOne);

export default router; 