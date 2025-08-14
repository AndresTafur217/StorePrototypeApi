const express = require('express');
const router = express.Router();
const usersController = require('./controllers/usersController');
const verifyRole = require('./middleware/verifyRole');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', authMiddleware, verifyRole('admin'), usersController.getUsers);
router.post('/signup', usersController.addUser);
router.post('/login', usersController.login);
router.get('/search/:term', usersController.searchUsers);
router.get('/:id/profile', usersController.getUserProfile);
router.post('/:id/change-password', usersController.changePassword);
router.put('/:id/update', usersController.updateUser);
router.patch('/:id/toggle-status', usersController.toggleUserStatus);
router.delete('/:id', authMiddleware, verifyRole(['admin']), usersController.deleteUser);

module.exports = router;