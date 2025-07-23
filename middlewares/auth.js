import jwt from 'jsonwebtoken';

// Verifica que el token es válido
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Verifica si el usuario tiene alguno de los roles permitidos
export const hasRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolUsuario = req.usuario?.rol;
    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({ message: 'Acceso denegado: rol no autorizado' });
    }
    next();
  };
};

// Verifica si el usuario es administrador (rol 0)
export const isAdmin = (req, res, next) => {
  const rolUsuario = req.usuario?.rol;
  if (rolUsuario !== 0) {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador' });
  }
  next();
};

// Verifica si el usuario tiene alguno de los roles permitidos (versión alternativa)
export const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    const rolUsuario = req.usuario?.rol;
    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({ message: 'Acceso denegado: rol no autorizado' });
    }
    next();
  };
};
