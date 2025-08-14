const bcrypt = require('bcrypt');
const fileManager = require('../utils/fileManager');
const { errorResponse } = require('../utils/responseHelper');

module.exports = {
  async findUser(email) {
    const users = await fileManager.readTable('users');
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const err = new Error('Credenciales incorrectas');
      err.status = 401;
      throw err;
    }
    return user;
  },

  async verifyPassword(plainPassword, user) {
    if (!user) {
      const err = new Error('Usuario no encontrado para verificar contraseña');
      err.status = 401;
      throw err;
    }
    const match = await bcrypt.compare(plainPassword, user.contraseña);
    if (!match) {
      const err = new Error('Contraseña incorrecta');
      err.status = 401;
      throw err;
    }
    return true;
  },

  async verifyState(user) {
    if (!user) {
      const err = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }
    if (user.estado !== 'activo') {
      const err = new Error('Usuario inactivo. Contacta al administrador');
      err.status = 403;
      throw err;
    }
    return true;
  }
};