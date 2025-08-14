const express = require('express');
const router = express.Router();
const specificationsController = require('./controllers/specificationsController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', specificationsController.getSpecifications);
router.delete('/:id', authMiddleware, verifyRole(['admin', 'vendedor']), specificationsController.deletespecification);
router.post('/add-specification', authMiddleware, verifyRole(['admin', 'vendedor']), specificationsController.addspecification);
router.get('/:id/specification', specificationsController.getSpecificationById);
router.put('/:id/update-specification', authMiddleware, verifyRole(['admin', 'vendedor']), specificationsController.updatespecification);

module.exports = router;