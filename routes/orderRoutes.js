const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const authMiddleware = require('../middleware/authMiddleware');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/', authMiddleware, ordersController.getOrders);
router.get('/filter-order', authMiddleware, ordersController.filterOrders);
router.post('/add-order', authMiddleware, ordersController.addOrder);
router.put('/:id/update-order', authMiddleware, validateId, ordersController.updateOrderStatus);
router.delete('/:id/cancel', authMiddleware, validateId, ordersController.cancelOrder);
router.delete('/:id/delete-order', authMiddleware, validateId, ordersController.deleteOrder);

module.exports = router;