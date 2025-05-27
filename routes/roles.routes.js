import { Router } from 'express';
import { verifyToken, hasRole } from '../middlewares/auth.js';

const router = Router();

router.get('/admin', verifyToken, hasRole(0), (req, res) => {  // Admin tiene rol 0
  res.json({ message: 'Bienvenido Admin' });
});

router.get('/jugador', verifyToken, hasRole(2), (req, res) => {  // Jugador tiene rol 2
  res.json({ message: 'Zona exclusiva para jugadores' });
});

router.get('/usuario', verifyToken, hasRole(1), (req, res) => {  // Usuario tiene rol 1
  res.json({ message: 'Hola usuario' });
});

export default router;
