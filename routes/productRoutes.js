const express = require('express');
const router = express.Router();
const productsController = require('./controllers/productsController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', productsController.getProducts);
router.delete('/delete/:id', authMiddleware, verifyRole(['admin', 'vendedor']), productsController.deleteProduct);
router.post('/add', authMiddleware, verifyRole(['admin', 'vendedor']), productsController.addProduct);
router.get('/:id/product', productsController.getProductById);
router.put('/:id/update', authMiddleware, verifyRole(['admin', 'vendedor']), productsController.updateProduct);
router.get('/search/:term', productsController.searchProduct);

module.exports = router;