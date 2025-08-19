const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const verifyRole = require('../middleware/verifyRole');
const authMiddleware = require('../middleware/authMiddleware');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/', productsController.getProducts);
router.get('/search/:term', productsController.searchProduct);
router.post('/add-product', authMiddleware, verifyRole(['admin', 'vendedor']), productsController.addProduct);
router.get('/:id/product', validateId, productsController.getProductById);
router.put('/:id/update-product', validateId, authMiddleware, verifyRole(['admin', 'vendedor']), productsController.updateProduct);
router.delete('/:id/delete-product', validateId, authMiddleware, verifyRole(['admin', 'vendedor']), productsController.deleteProduct);

module.exports = router;