import express from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import {
    getAllCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria
} from '../controllers/categoria.controller.js';

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.get('/', getAllCategorias);
router.get('/:id', getCategoriaById);

// Rutas protegidas (requieren autenticación)
router.post('/', verificarToken, createCategoria);
router.put('/:id', verificarToken, updateCategoria);
router.delete('/:id', verificarToken, deleteCategoria);

export default router; 