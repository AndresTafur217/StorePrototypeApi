const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const verifyRole = require('../middleware/verifyRole');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/sales', authMiddleware, verifyRole(['admin','vendedor']), reportsController.getSalesReport);
router.get('/month-sales', authMiddleware, verifyRole(['admin','vendedor']), reportsController.getMonthlySales);
router.delete('/out-stock', authMiddleware, verifyRole(['admin','vendedor']), reportsController.getOutOfStockProducts);
router.post('/top-customer', authMiddleware, verifyRole(['admin', 'vendedor']), reportsController.getTopCustomers);

module.exports = router;