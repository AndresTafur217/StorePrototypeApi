const express = require('express');
const router = express.Router();
const productsController = require('./controllers/productsController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', productsController.getProducts);
router.delete('/:id', authMiddleware, verifyRole('admin'), verifyRole('vendedor'), productsController.deleteProduct);
router.post('/add-product', authMiddleware, verifyRole('admin'), verifyRole('vendedor'), productsController.addProduct);
router.get('/:id/product', productsController.getProductById);
router.put('/:id/update-product', authMiddleware, verifyRole('admin'), verifyRole('vendedor'), productsController.updateProduct);
router.get('/search/:term', productsController.searchProduct);

module.exports = router;