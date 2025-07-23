import express from 'express';
import { addVideoHistorico, getVideosHistoricos } from '../controllers/videos_historicos.controller.js';
import { verifyToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', verifyToken, checkRole([0]), addVideoHistorico); // Solo admin
router.get('/', getVideosHistoricos);

export default router; 