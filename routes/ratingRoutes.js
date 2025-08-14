const express = require('express');
const router = express.Router();
const ratingsController = require('./controllers/ratingsController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/:id/rating-product', ratingsController.getRatingsByProduct);
router.delete('/:id/rating-user', ratingsController.getRatingsBySeller);
router.post('/add', ratingsController.addRating);

module.exports = router;