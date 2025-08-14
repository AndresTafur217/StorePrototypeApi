const express = require('express');
const router = express.Router();
const invoicesController = require('./controllers/invoicesController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', invoicesController.getInvoices);
router.get('/:id/pay', invoicesController.payInvoice);
router.get('/filter?', invoicesController.filterInvoices);
router.get('/invoice', invoicesController.createInvoice);

module.exports = router;