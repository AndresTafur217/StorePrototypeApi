const fileManager = require('../utils/fileManager');
const { generateId } = require('../utils/idGenerator');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const auth = require('../middleware/authUser');

const typesController = {
  async addType(req, res) {
    try {
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para realizar esta accion')
        );
      }

      await fileManager.ensureTable('types');
          
      const { nombre, descripcion } = req.body;

      if (!nombre || !descripcion) {
        return res.status(400).json(
          errorResponse('Nombre y descripcion son obligatorios')
        );
      }

      const newType = {
        id: generateId(),
        nombre: nombre,
        descripcion: descripcion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const types = await fileManager.readTable('types');
      types.push(newType);
      await fileManager.writeTable('types', types);

      const typeResponce = {...newType};

      res.status(201).json(
        successResponse(typeResponce, 'type agregada exitosamente')
      );
    } catch(error){
      console.error('Error agregando type:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getTypes(req, res) {
    try {
      const types =await fileManager.readTable('types');

      const typesResponce = types.map(type => {
        const safeType = { ...type };
        return safeType;
      });

      res.json(
        successResponse(typesResponce, `${typesResponce.length} types encontrados`)
      );
    } catch(error){
      console.error('Error obteniendo type:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getTypeById(req, res) {
    try {
      const { id } = req.params;

      const types = await fileManager.readTable('types');
      
      const type = types.find(s => s.id === id);

      if (!type) {
        return res.status(404).json(
          errorResponse('type no encontrada')
        );
      }

      const typeById = { ...type };

      res.json(
        successResponse(typeById, 'Objeto obtenido')
      );
    } catch(error) {
      console.error('Error obteniendo producto por id', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async updateType(req, res) {
    try {
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para realizar esta accion')
        );
      }

      const { id } = req.params;

      const typeData = req.body;

      const types = await fileManager.readTable('types');      
      const typeIndex = types.findIndex(s => s.id === id);

      if (typeIndex === -1) {
        return res.status(404).json(
          errorResponse('type no encontrada')
        );
      }

      const type = types[typeIndex];

      const updateType = {
        ...type,
        nombre: typeData.nombre || type.nombre,
        descripcion: typeData.descripcion || type.descripcion,
        updatedAt: new Date().toISOString()
      };

      await fileManager.updateInTable ('types', id, updateType)

      // Responder sin contraseña
      const typeResponce = { ...updateType };

      res.json(
        successResponse(typeResponce, 'Objeto obtenido')
      );
    } catch(error) {
      console.error('Error obteniendo type por id', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async deleteType(req, res) {
    try{
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para esta accion')
        );
      }

      const { id } = req.params;
      
      // Buscar usuario
      const types = await fileManager.readTable('types');
      const typeIndex = types.findIndex(s => s.id === id);

      if (typeIndex === -1) {
        return res.status(404).json(errorResponse('registro no encontrado'));
      }

      await fileManager.removeFromTable ('types', id);

      res.status(204).json(
        successResponse('registro eliminado exitosamente')
      );

    } catch (error) {
      if (error.message === 'Registro no encontrado') {
        return res.status(404).json(
          errorResponse('registro no encontrado')
        );
      }

      console.error('Error eliminando registro:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  }
};

module.exports = typesController;