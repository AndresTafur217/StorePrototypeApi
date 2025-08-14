const express = require('express');
const router = express.Router();
const ordersController = require('./controllers/ordersController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', ordersController.getOrders);
router.get('/:id/type', ordersController.getTypesById);
router.delete('/cancel/:id', ordersController.cancelOrder);
router.delete('/delete/:id', ordersController.deleteOrder);
router.get('/filter?', ordersController.filterOrders);
router.post('/add', ordersController.addOrder);
router.put('/:id/update', ordersController.updateOrderStatus);

module.exports = router;