const jwt = require('jsonwebtoken');
const fileManager = require('../utils/fileManager');
const { errorResponse } = require('../utils/responseHelper');

const SECRET_KEY = process.env.SECRET_KEY; // pon esto en variables de entorno

if (!SECRET_KEY) {
  console.warn('⚠️ WARNING: SECRET_KEY no está definido en las variables de entorno');
}

module.exports = async function (req, res, next) {
  try {
    // Leer el token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(errorResponse('Token no proporcionado'));
    }

    // Verificar el token
    const decoded = jwt.verify(token, SECRET_KEY);

    // Cargar el usuario desde tu "base de datos" JSON
    const users = await fileManager.readTable('users');
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(404).json(errorResponse('Usuario no encontrado'));
    }

    // Guardar el usuario en req.user
    req.user = user;

    next(); // continuar a la siguiente función

  } catch (error) {
    console.error('Error en authMiddleware:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('Token expirado'));
    }
    return res.status(403).json(errorResponse('Token inválido o expirado'));
  }
};
