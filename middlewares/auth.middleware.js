import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Token no proporcionado o formato inválido'
        });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET);
        
        // Asegurarnos de que el token incluya el rol
        if (decoded.rol === undefined) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido: falta información del rol'
            });
        }
        
        req.user = {
            nickname: decoded.nickname,
            rol: decoded.rol
        };
        
        next();
    } catch (error) {
        console.error('Error al verificar token:', error);
        return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado'
        });
    }
}; 