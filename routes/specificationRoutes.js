const express = require('express');
const router = express.Router();
const specificationsController = require('../controllers/specificationsController');
const verifyRole = require('../middleware/verifyRole');
const authMiddleware = require('../middleware/authMiddleware');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

// Obtener todas las especificaciones
router.get('/', specificationsController.getSpecifications);
router.post( '/add-spec', authMiddleware, verifyRole(['admin', 'vendedor']), specificationsController.addSpecification);
router.get('/:id/specification', validateId, specificationsController.getSpecificationById);
router.put('/:id/update-pec', validateId, authMiddleware,verifyRole(['admin', 'vendedor']),specificationsController.updateSpecification);
router.delete( '/:id/delete-spec', validateId, authMiddleware, verifyRole(['admin', 'vendedor']), specificationsController.deleteSpecification);

module.exports = router;