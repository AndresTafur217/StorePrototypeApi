const express = require('express');
const router = express.Router();
const favoritesController = require('./controllers/favoritesController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', favoritesController.getFavorites);
router.delete('/delete/:id', favoritesController.deleteFavorite);
router.post('/add', favoritesController.addFavorite);
router.post('/filter?', favoritesController.filterFavorites);

module.exports = router;