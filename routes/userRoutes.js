const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');

router.post('/', userController.createUser);

// Autenticación
router.post('/login', userController.login);

// Gestión de perfil
router.get('/:id/profile', userController.getUserProfile);
router.post('/:id/change-password', userController.changePassword);

// Gestión de estado
router.patch('/:id/toggle-status', userController.toggleUserStatus);

// Búsquedas
router.get('/search/:term', userController.searchUsers);

// ============================================
// NOTA: Las rutas CRUD genéricas siguen disponibles:
// GET /api/users (obtener todos)
// GET /api/users/:id (obtener por ID)  
// PUT /api/users/:id (actualizar completo)
// PATCH /api/users/:id (actualizar parcial)
// DELETE /api/users/:id (eliminar)
// ============================================

module.exports = router;