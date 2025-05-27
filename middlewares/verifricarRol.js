import jwt from 'jsonwebtoken';

// Middleware para verificar el token
export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Obtenemos el token del header

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, token no encontrado' });
  }

  try {
    // Verificar el token con JWT
    const decoded = jwt.verify(token, process.env.SECRET); // Decodificamos el token
    req.user = decoded; // Almacenamos los datos decodificados en `req.user`
    next(); // Pasamos al siguiente middleware o ruta
  } catch (error) {
    return res.status(400).json({ message: 'Token no válido' });
  }
};

// Middleware para verificar el rol utilizando ID (0 - admin, 1 - usuario, 2 - jugador)
export const hasRole = (roleId) => {
  return (req, res, next) => {
    if (!req.user || req.user.rol !== roleId) {
      return res.status(403).json({ message: 'Acceso denegado, rol no autorizado' });
    }
    next(); // Si el rol es el adecuado, pasamos a la siguiente ruta
  };
};
