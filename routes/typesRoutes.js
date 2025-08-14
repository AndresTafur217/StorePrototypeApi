const express = require('express');
const router = express.Router();
const typesController = require('./controllers/typesController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', typesController.getTypes);
router.get('/:id/type', typesController.getTypesById);
router.delete('/delete/:id', authMiddleware, verifyRole(['admin']), typesController.deleteType);
router.post('/add', authMiddleware, verifyRole(['admin']), typesController.addType);
router.put('/:id/update', authMiddleware, verifyRole(['admin']), typesController.updateType);

module.exports = router;