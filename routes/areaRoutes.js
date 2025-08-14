const express = require('express');
const router = express.Router();
const areasController = require('./controllers/areasController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', areasController.getAreas);
router.get('/:id/area', areasController.getAreasById);
router.delete('/delete/:id', authMiddleware, verifyRole(['admin']), areasController.deleteArea);
router.post('/add', authMiddleware, verifyRole(['admin']), areasController.addArea);
router.put('/:id/update', authMiddleware, verifyRole(['admin']), areasController.updateArea);

module.exports = router;