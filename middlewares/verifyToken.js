export const verifyToken = (req, res, next) => {
    console.log('Middleware verifyToken pasó correctamente (por ahora sin validar nada)');
    next(); // deja pasar a la siguiente función
  }
  