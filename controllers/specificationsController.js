const fileManager = require('./utils/fileManager');
const { generateId } = require('./utils/idGenerator');
const { successResponse, errorResponse } = require('./utils/responseHelper');
const auth = require('./middleware/authUser');

const specificationsController = {
  async addSpecification(req, res) {
    try {
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para realizar esta accion')
        );
      }

      await fileManager.ensureTable('specifications');
          
      const { nombre, descripcion, imagen } = req.body;

      if (!nombre || !descripcion) {
        return res.status(400).json(
          errorResponse('Nombre y descripcion son obligatorios')
        );
      }

      const newSpec = {
        id: generateId(),
        nombre: nombre,
        descripcion: descripcion,
        imagen: imagen,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const specs = await fileManager.readTable('specifications');
      specs.push(newSpec);
      await fileManager.writeTable('specifications', specs);

      const specResponce = {...newSpec};

      res.status(201).json(
        successResponse(specResponce, 'Especificacion agregada exitosamente')
      );
    } catch(error){
      console.error('Error agregando especificacion:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getSpecifications(req, res) {
    try {
      const specs =await fileManager.readTable('specifications');

      const specsResponce = specs.map(spec => {
        const safeSpec = { ...spec };
        return safeSpec;
      });

      res.json(
        successResponse(specsResponce, `${specsResponce.length} especificaciones encontrados`)
      );
    } catch(error){
      console.error('Error obteniendo especificaciones:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getSpecificationsById(req, res) {
    try {
      const { id } = req.params;

      const specs = await fileManager.readTable('specifications');
      
      const spec = specs.find(s => s.id === id);

      if (!spec) {
        return res.status(404).json(
          errorResponse('Especificacion no encontrada')
        );
      }

      const specById = { ...spec };

      res.json(
        successResponse(specById, 'Objeto obtenido')
      );
    } catch(error) {
      console.error('Error obteniendo producto por id', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async updateSpecification(req, res) {
    try {
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para realizar esta accion')
        );
      }

      const { id } = req.params;
      const specData = req.body;

      const specs = await fileManager.readTable('specifications');      
      const specIndex = specs.findIndex(s => s.id === id);

      if (specIndex === -1) {
        return res.status(404).json(
          errorResponse('Especificacion no encontrada')
        );
      }

      const spec = specs[specIndex];

      const updateSpec = {
        ...spec,
        nombre: specData.nombre || spec.nombre,
        descripcion: specData.descripcion || spec.descripcion,
        imagen: specData.imagen || spec.imagen,
        updatedAt: new Date().toISOString()
      };

      await fileManager.updateInTable ('specifications', id, updateSpec)

      // Responder sin contraseña
      const specResponce = { ...updateSpec };

      res.json(
        successResponse(specResponce, 'Objeto obtenido')
      );
    } catch(error) {
      console.error('Error obteniendo producto por id', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async deleteSpecification(req, res) {
    try{
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para esta accion')
        );
      }

      const { id } = req.params;
      
      // Buscar usuario
      const specs = await fileManager.readTable('specifications');
      const specIndex = specs.findIndex(s => s.id === id);

      if (specIndex === -1) {
        return res.status(404).json(errorResponse('registro no encontrado'));
      }

      await fileManager.removeFromTable ('specifications', id);

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

module.exports = specificationsController;