const rateLimit = require('express-rate-limit');
const fileManager = require('../utils/fileManager');
const { errorResponse } = require('../utils/responseHelper');
const securityController = require('../controllers/securityController');

// Limitar solicitudes por IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  handler: (req, res) => {
    securityController.registerIncident(req, 'RateLimit', 'IP excedió el límite de peticiones');
    return res.status(429).json(errorResponse('Demasiadas solicitudes, intente más tarde'));
  }
});

// Validar roles para rutas específicas
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      securityController.registerIncident(req, 'UnauthorizedAccess', `Intento de acceso no permitido`);
      return res.status(403).json(errorResponse('No tienes permiso para realizar esta acción'));
    }
    next();
  };
}

// Bloqueo de usuarios sospechosos
async function checkUserBlock(req, res, next) {
  await fileManager.ensureTable('user_blocks');
  const blocks = await fileManager.readTable('user_blocks');
  const block = blocks.find(b => b.usuarioId === req.user.id);

  if (block && new Date(block.expira) > new Date()) {
    return res.status(403).json(errorResponse(`Tu cuenta está bloqueada hasta ${block.expira}`));
  }
  next();
}

module.exports = {
  apiLimiter,
  authorizeRoles,
  checkUserBlock
};