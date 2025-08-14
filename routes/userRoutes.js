const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const verifyRole = require('../middleware/verifyRole');
const authMiddleware = require('../middleware/authMiddleware');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
};

router.get('/', authMiddleware, verifyRole(['admin']), usersController.getUsers);
router.post('/signup', usersController.addUser);
router.post('/login', usersController.login);
router.get('/search/:term', usersController.searchUsers);
router.get('/:id/profile', validateId, usersController.getUserProfile);
router.post('/:id/change-password', validateId, authMiddleware, usersController.changePassword);
router.patch('/:id/toggle-status', validateId, authMiddleware, verifyRole(['admin']), usersController.toggleUserStatus);
router.put('/:id/update-user', validateId, authMiddleware, usersController.updateUser);
router.delete('/:id/delete-user', validateId, authMiddleware, verifyRole(['admin']), usersController.deleteUser);
// router.get('/users', authMiddleware, verifyRole(['admin']), usersController.getUsers);

module.exports = router;
