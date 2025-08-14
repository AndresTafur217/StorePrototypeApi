const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/orders', ordersController.getOrders);
router.get('/filter-order', ordersController.filterOrders);
router.post('/add-order', ordersController.addOrder);
router.put('/:id/update-order', validateId, ordersController.updateOrderStatus);
router.delete('/:id/cancel', validateId, ordersController.cancelOrder);
router.delete('/:id/delete-order', validateId, ordersController.deleteOrder);

module.exports = router;