const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');
const authMiddleware = require('../middleware/authMiddleware');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/', authMiddleware, invoicesController.getInvoices);
router.get('/filter', authMiddleware, invoicesController.filterInvoices);
router.get('/invoice', authMiddleware, invoicesController.createInvoice);
router.get('/:id/pay', authMiddleware, validateId, invoicesController.payInvoice);

module.exports = router;