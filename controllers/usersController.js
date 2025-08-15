const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fileManager = require('../utils/fileManager');
const { generateId } = require('../utils/idGenerator');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const auth = require('../middleware/authUser');
const notificationsController = require('./notificationsController');

// Configuración para bcrypt
const SALT_ROUNDS = 10;

const userController = {
  // agregar nuevo usuario
  async addUser(req, res) {
    try {
      // Asegurar que existe la tabla users
      await fileManager.ensureTable('users');
      
      // Recibir datos
      const {
        tipoIdentificacion,
        nId,
        nombres,
        apellidos,
        email,
        telefono,
        celular,
        fechaNacimiento,
        ciudadDepartamento,
        pais,
        direccion,
        contraseña,
        rol,
        estado
      } = req.body;

      // Validaciones
      if (!nombres || !apellidos || !email || !contraseña) {
        return res.status(400).json(
          errorResponse('Nombres, apellidos, email y contraseña son obligatorios')
        );
      }
      if (!telefono && !celular) {
        return res.status(400).json(
          errorResponse('Debe agregar al menos uno de los dos campos')
        );
      }

      // Verificar si el usuario ya existe
      const existingUsers = await fileManager.readTable('users');
      const userExists = existingUsers.some(user => 
        user.email.toLowerCase() === email.toLowerCase() ||
        user.nId.toLowerCase() === nId.toLowerCase()
      );

      if (userExists) {
        return res.status(409).json(
          errorResponse('Ya existe un usuario con ese email o con ese numero de identificación')
        );
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(contraseña, SALT_ROUNDS);

      // Crear objeto usuario
      const newUser = {
        id: generateId(),
        tipoIdentificacion: tipoIdentificacion || 'CC',
        nId: nId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.toLowerCase().trim(),
        fechaNacimiento: fechaNacimiento || '',
        ciudadDepartamento: ciudadDepartamento || '',
        pais: pais || 'Colombia',
        rol: rol || 'cliente',
        direccion: direccion || '',
        contraseña: hashedPassword,
        fechaIngreso: new Date().toISOString(),
        estado: 'activo',
        valoracionPromedio: 0,
        totalValoraciones: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Guardar usuario
      const users = await fileManager.readTable('users');
      users.push(newUser);
      await fileManager.writeTable('users', users);

      // Responder sin contraseña
      const userResponse = { ...newUser };
      delete userResponse.contraseña;

      // Crear notificación (con manejo de errores)
      try {
        await notificationsController.createNotification({
          body: {
            usuarioId: newUser.id,
            mensaje: '¡Bienvenido! Tu registro ha sido exitoso.',
            tipo: 'success'
          }
        }, { status: () => ({ json: () => {} }) });
      } catch (notifError) {
        console.error('Error creando notificación:', notifError);
      }

      res.status(201).json(
        successResponse(userResponse, 'Usuario agregado exitosamente')
      );

    } catch (error) {
      console.error('Error agregando usuario:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  // Login de usuario
  async login(req, res) {
    try {
      // Obtener datos de inicio de sesion
      const { email, contraseña } = req.body;

      // Validaciones
      if (!email || !contraseña) {
        return res.status(400).json(
          errorResponse('Email y contraseña son obligatorios')
        );
      }

      // Autenticacion de usuario
      const user = await auth.findUser(email);
      await auth.verifyPassword(contraseña, user);
      await auth.verifyState(user);

      // Generar token
      const token = jwt.sign(
        { id: user.id, rol: user.rol, email: user.email },
        process.env.SECRET_KEY || 'fallback-secret-key',
        { expiresIn: '1h' }
      );

      // Responder sin contraseña
      const userResponse = { ...user };
      delete userResponse.contraseña;

      res.json(
        successResponse({ user: userResponse, token }, 'Login exitoso')
      );

    } catch (err) {
      console.error('Error en login:', err);
      const status = err.status || 500;
      const message = err.message || 'Error interno en login';
      res.status(status).json(errorResponse(message));
    }
  },

  // Cambiar contraseña
  async changePassword(req, res) {
    try {
      // Obtener datos de cambio de contraseña
      const { id } = req.params;
      const { contraseñaActual, contraseñaNueva } = req.body;

      if (!contraseñaActual || !contraseñaNueva) {
        return res.status(400).json(
          errorResponse('Contraseña actual y nueva son obligatorias')
        );
      }

      // Buscar usuario
      const users = await fileManager.readTable('users');
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        return res.status(404).json(
          errorResponse('Usuario no encontrado')
        );
      }

      // Verificar contraseña actual
      const passwordMatch = await bcrypt.compare(
        contraseñaActual, 
        users[userIndex].contraseña
      );

      if (!passwordMatch) {
        return res.status(401).json(
          errorResponse('Contraseña actual incorrecta')
        );
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await bcrypt.hash(contraseñaNueva, SALT_ROUNDS);

      // Actualizar usuario
      users[userIndex] = {
        ...users[userIndex],
        contraseña: hashedNewPassword,
        updatedAt: new Date().toISOString()
      };

      await fileManager.writeTable('users', users);

      res.json(
        successResponse(null, 'Cambio de contraseña exitoso')
      );

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json(
        errorResponse('Error interno al cambiar contraseña')
      );
    }
  },

  // Obtener todos los usuarios
  async getUsers(req, res) {
    try {
      // Verificar que el usuario autenticado es admin
      if (req.user.rol !== 'admin') {
        return res.status(403).json(
          errorResponse('No tienes permisos para ver la lista de usuarios')
        );
      }

      // Leer todos los usuarios
      const users = await fileManager.readTable('users');

      // Eliminar contraseñas antes de responder
      const usersResponse = users.map(user => {
        const safeUser = { ...user };
        delete safeUser.contraseña;
        return safeUser;
      });

      res.json(
        successResponse(usersResponse, `${usersResponse.length} usuarios encontrados`)
      );

    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json(
        errorResponse('Error interno al obtener usuarios')
      );
    }
  },

  // Obtener perfil de usuario
  async getUserProfile(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar existencia de usuario
      const users = await fileManager.readTable('users');
      const user = users.find(u => u.id === id);

      if (!user) {
        return res.status(404).json(
          errorResponse('Usuario no encontrado')
        );
      }

      // Responder sin contraseña
      const userProfile = { ...user };
      delete userProfile.contraseña;

      res.json(
        successResponse(userProfile, 'Perfil obtenido')
      );

    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json(
        errorResponse('Error interno al obtener perfil')
      );
    }
  },

  // Cambiar estado de usuario
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar existencia de usuario
      const users = await fileManager.readTable('users');
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        return res.status(404).json(
          errorResponse('Usuario no encontrado')
        );
      }

      // Cambiar estado
      const newStatus = users[userIndex].estado === 'activo' ? 'inactivo' : 'activo';
      users[userIndex] = {
        ...users[userIndex],
        estado: newStatus,
        updatedAt: new Date().toISOString()
      };

      // Crear notificaciones
      try {
        const mensaje = newStatus === 'inactivo' 
          ? 'Nos entristece que te vayas, esperamos que vuelvas pronto.'
          : '¡Bienvenido de vuelta! nos alegra que vuelvas y nos acompañes.';

        await notificationsController.createNotification({
          body: {
            usuarioId: users[userIndex].id,
            mensaje,
            tipo: 'success'
          }
        }, { status: () => ({ json: () => {} }) });
      } catch (notifError) {
        console.error('Error creando notificación:', notifError);
      }

      // sobre escribir usuario
      await fileManager.writeTable('users', users);

      const userResponse = { ...users[userIndex] };
      delete userResponse.contraseña;

      res.json(
        successResponse(userResponse, `Usuario ${newStatus}`)
      );

    } catch (error) {
      console.error('Error cambiando estado:', error);
      res.status(500).json(
        errorResponse('Error interno al cambiar estado')
      );
    }
  },

  // Actualizar/editar usuario
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      // Buscar usuario
      const users = await fileManager.readTable('users');
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        return res.status(404).json(
          errorResponse('Usuario no encontrado')
        );
      }

      const user = users[userIndex];
      
      const rolesPermitidos = ['cliente', 'admin', 'vendedor'];
      const estadosPermitidos = ['activo', 'inactivo', 'bloqueado'];

      // Validaciones correctas
      if (userData.rol && !rolesPermitidos.includes(userData.rol)) {        
        return res.status(400).json(errorResponse('Rol no permitido'));
      }

      if (userData.estado && !estadosPermitidos.includes(userData.estado)) {
        return res.status(400).json(errorResponse('Estado no permitido'));        
      }

      // Mantener valores anteriores si no se envía un campo
      const updateUser = {
        ...user,
        tipoIdentificacion: userData.tipoIdentificacion || user.tipoIdentificacion,
        nId: userData.nId || user.nId,
        nombres: userData.nombres || user.nombres,
        apellidos: userData.apellidos || user.apellidos,
        email: userData.email || user.email,
        telefono: userData.telefono || user.telefono,
        celular: userData.celular || user.celular,
        fechaNacimiento: userData.fechaNacimiento || user.fechaNacimiento,
        ciudadDepartamento: userData.ciudadDepartamento || user.ciudadDepartamento,
        pais: userData.pais || user.pais,
        direccion: userData.direccion || user.direccion,
        rol: userData.rol || user.rol,
        estado: userData.estado || user.estado,
        updatedAt: new Date().toISOString()
      };

      await fileManager.updateInTable('users', id, updateUser);

      // Responder sin contraseña
      const userResponse = { ...updateUser };
      delete userResponse.contraseña;

      res.status(200).json(
        successResponse(userResponse, 'Usuario actualizado exitosamente')
      );
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json(
        errorResponse('Error interno al actualizar usuario')
      );
    }
  },

  // Buscar usuarios
  async searchUsers(req, res) {
    try {
      const { term } = req.params;
      
      const users = await fileManager.readTable('users');
      const filteredUsers = users.filter(user => 
        user.nombres.toLowerCase().includes(term.toLowerCase()) ||
        user.apellidos.toLowerCase().includes(term.toLowerCase()) ||
        (user.ciudadDepartamento && user.ciudadDepartamento.toLowerCase().includes(term.toLowerCase()))
      );

      // Responder sin contraseñas
      const usersResponse = filteredUsers.map(user => {
        const userCopy = { ...user };
        delete userCopy.contraseña;
        return userCopy;
      });

      res.json(
        successResponse(usersResponse, `${usersResponse.length} usuarios encontrados`)
      );

    } catch (error) {
      console.error('Error buscando usuarios:', error);
      res.status(500).json(
        errorResponse('Error interno en búsqueda')
      );
    }
  },
  
  // Eliminar usuario
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Buscar usuario
      const users = await fileManager.readTable('users');
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        return res.status(404).json(errorResponse('Usuario no encontrado'));
      }

      await fileManager.removeFromTable('users', id);

      res.status(204).json(
        successResponse('Usuario eliminado exitosamente')
      );

    } catch (error) {
      if (error.message === 'Registro no encontrado') {
        return res.status(404).json(
          errorResponse('Usuario no encontrado')
        );
      }

      console.error('Error eliminando usuario:', error);
      res.status(500).json(
        errorResponse('Error interno al eliminar usuario')
      );
    }
  }
};

module.exports = userController;