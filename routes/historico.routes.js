import express from 'express';
import { 
  getEdicionesHistoricas, 
  getTablaGeneralHistorica 
} from '../controllers/historico.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Obtener todas las ediciones históricas
router.get('/ediciones', verifyToken, getEdicionesHistoricas);

// Obtener tabla general histórica por edición
router.get('/tabla-general/:idEdicion', verifyToken, getTablaGeneralHistorica);

export default router; 