const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesController');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/invoices', invoicesController.getInvoices);
router.get('/filter', invoicesController.filterInvoices);
router.get('/invoice', invoicesController.createInvoice);
router.get('/:id/pay', validateId, invoicesController.payInvoice);

module.exports = router;