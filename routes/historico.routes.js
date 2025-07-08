import express from 'express';
import { 
  getEdicionesHistoricas, 
  getTablaGeneralHistorica 
} from '../controllers/historico.controller.js';

const router = express.Router();

// Obtener todas las ediciones históricas (público)
router.get('/ediciones', getEdicionesHistoricas);

// Obtener tabla general histórica por edición (público)
router.get('/tabla-general/:idEdicion', getTablaGeneralHistorica);

export default router; 