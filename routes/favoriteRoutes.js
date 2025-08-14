const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/favorites', favoritesController.getFavorites);
router.post('/add-favorite', favoritesController.addFavorite);
router.post('/filter-favorite', favoritesController.filterFavorites);
router.delete('/:id/delete-favorite', validateId, favoritesController.deleteFavorite);

module.exports = router;