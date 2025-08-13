module.exports = function(requiredRole) {
  return (req, res, next) => {
    if (req.user.rol !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }
    next();
  };
};