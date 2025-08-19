const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const authMiddleware = require('../middleware/authMiddleware');


const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/', authMiddleware, favoritesController.getFavorites);
router.post('/add-favorite', authMiddleware, favoritesController.addFavorite);
router.post('/filter-favorite', authMiddleware, favoritesController.filterFavorites);
router.delete('/:id/delete-favorite', authMiddleware, validateId, favoritesController.deleteFavorite);

module.exports = router;