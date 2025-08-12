const bcrypt = require('bcrypt');
const fileManager = require('./utils/fileManager');
const { generateId } = require('./utils/idGenerator');
const { successResponse, errorResponse } = require('./utils/responseHelper');
const auth = require('./middleware/authUser');

// Configuración para bcrypt
const SALT_ROUNDS = 10;

const userController = {
  // Crear nuevo usuario
  async createUser(req, res) {
    try {
      // Asegurar que existe la tabla users
      await fileManager.ensureTable('users');
      
      // Recibir datos
      const {
        tipoIdentificacion,
        nombres,
        apellidos,
        email,
        fechaNacimiento,
        ciudadDepartamento,
        pais,
        direccion,
        contraseña
      } = req.body;

      // Validaciones
      if (!nombres || !apellidos || !email || !contraseña) {
        return res.status(400).json(
          errorResponse('Todos los campos son obligatorios')
        );
      }

      // Verificar si el usuario ya existe
      const existingUsers = await fileManager.readTable('users');
      const userExists = existingUsers.some(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );

      if (userExists) {
        return res.status(409).json(
          errorResponse('Ya existe un usuario con ese email')
        );
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(contraseña, SALT_ROUNDS);

      // Crear objeto usuario
      const newUser = {
        id: generateId(),
        tipoIdentificacion: tipoIdentificacion || 'CC',
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        fechaNacimiento,
        ciudadDepartamento: ciudadDepartamento || ' ',
        pais: pais || 'Colombia',
        direccion: direccion || '',
        contraseña: hashedPassword,
        fechaIngreso: new Date().toISOString(),
        estado: 'activo',
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

      res.status(201).json(
        successResponse(userResponse, 'Usuario creado exitosamente')
      );

    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).json(
        errorResponse('Error interno al crear usuario')
      );
    }
  },

  // Login de usuario
  async login(req, res) {
    try {
      const { email, contraseña } = req.body;

      if (!email || !contraseña) {
        return res.status(400).json(
          errorResponse('Email y contraseña son obligatorios')
        );
      }

      // Validaciones ./middleware/authUser
      await auth.findUser (email);
      await auth.verifyPassword(contraseña, user);
      await auth.verifyState (user)

      // Responder sin contraseña
      const userResponse = { ...user };
      delete userResponse.contraseña;

      res.json(
        successResponse(userResponse, 'Login exitoso')
      );

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json(
        errorResponse('Error interno en login')
      );
    }
  },

  // Cambiar contraseña
  async changePassword(req, res) {
    try {
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

  // Obtener perfil de usuario
  async getUserProfile(req, res) {
    try {
      const { id } = req.params;
      
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
  async editUser (req, res) {
    try{
      const { id } = req.params;

      // Recibir los datos
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

      // Mantener valores anteriores si no se envía un campo
      const updatedUser = {
        ...user,
        tipoIdentificacion: userData.tipoIdentificacion || user.tipoIdentificacion,
        nombres: userData.nombres || user.nombres,
        apellidos: userData.apellidos || user.apellidos,
        email: userData.email || user.email,
        fechaNacimiento: userData.fechaNacimiento || user.fechaNacimiento,
        ciudadDepartamento: userData.ciudadDepartamento || user.ciudadDepartamento,
        pais: userData.pais || user.pais,
        direccion: userData.direccion || user.direccion,
        estado: userData.estado || user.estado,
        updatedAt: new Date().toISOString()
      };

      await fileManager.updateInTable ('users', id, updatedUser)

      // Responder sin contraseña
      const userResponse = { ...editUser };
      delete userResponse.contraseña;

      res.status(201).json(
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
        user.ciudadDepartamento.toLowerCase().includes(term.toLowerCase())
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
  }
};

module.exports = userController;