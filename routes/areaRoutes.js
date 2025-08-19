const express = require('express');
const router = express.Router();
const areasController = require('../controllers/areasController');
const verifyRole = require('../middleware/verifyRole');
const authMiddleware = require('../middleware/authMiddleware');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/', areasController.getAreas);
router.post('/add-area', authMiddleware, verifyRole(['admin']), areasController.addArea);
router.get('/:id/area', validateId, areasController.getAreasById);
router.put('/:id/update-area', validateId, authMiddleware, verifyRole(['admin']), areasController.updateArea);
router.delete('/:id/delete-area', validateId, authMiddleware, verifyRole(['admin']), areasController.deleteArea);

module.exports = router;