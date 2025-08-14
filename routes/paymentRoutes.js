const express = require('express');
const router = express.Router();
const paymentsController = require('./controllers/paymentsController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.post('/add', paymentsController.createPayment);

module.exports = router;