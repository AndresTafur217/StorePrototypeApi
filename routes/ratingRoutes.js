const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratingsController');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.post('/add-rating', ratingsController.addRating);
router.get('/:id/rating-product', validateId, ratingsController.getRatingsByProduct);
router.delete('/:id/rating-user', validateId, ratingsController.getRatingsBySeller);

module.exports = router;