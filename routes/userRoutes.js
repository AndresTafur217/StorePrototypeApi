const express = require('express');
const router = express.Router();
const usersController = require('./controllers/usersController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', authMiddleware, verifyRole('admin'), usersController.getUsers);
router.delete('/:id', authMiddleware, verifyRole('admin'), usersController.deleteUser);
router.post('/signup', usersController.createUser);
router.post('/login', usersController.login);
router.get('/:id/profile', usersController.getUserProfile);
router.post('/:id/change-password', usersController.changePassword);
router.put('/:id/update-user', usersController.updateUser);
router.patch('/:id/toggle-status', usersController.toggleUserStatus);
router.get('/search/:term', usersController.searchUsers);

module.exports = router;