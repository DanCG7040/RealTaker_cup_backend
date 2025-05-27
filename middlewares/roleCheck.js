export const checkAdminRole = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Usuario no autenticado'
        });
    }

    if (req.user.rol !== 0) {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requiere rol de administrador'
        });
    }

    next();
};