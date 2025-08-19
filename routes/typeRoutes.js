const express = require('express');
const router = express.Router();
const typesController = require('../controllers/typesController');
const verifyRole = require('../middleware/verifyRole');
const authMiddleware = require('../middleware/authMiddleware');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/', typesController.getTypes);
router.post('/add-type', authMiddleware, verifyRole(['admin']), typesController.addType);
router.get('/:id/type', validateId, typesController.getTypeById);
router.put('/:id/update-type', validateId, authMiddleware, verifyRole(['admin']), typesController.updateType);
router.delete('/:id/delete-type', validateId, authMiddleware, verifyRole(['admin']), typesController.deleteType);

module.exports = router;