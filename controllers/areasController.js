const fileManager = require('./utils/fileManager');
const { generateId } = require('./utils/idGenerator');
const { successResponse, errorResponse } = require('./utils/responseHelper');
const auth = require('./middleware/authUser');

const areasController = {
  async addArea(req, res) {
    try {
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para realizar esta accion')
        );
      }

      await fileManager.ensureTable('areas');
          
      const { nombre, descripcion } = req.body;

      if (!nombre || !descripcion) {
        return res.status(400).json(
          errorResponse('Nombre y descripcion son obligatorios')
        );
      }

      const newArea = {
        id: generateId(),
        nombre: nombre,
        descripcion: descripcion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const areas = await fileManager.readTable('areas');
      areas.push(newArea);
      await fileManager.writeTable('areas', areas);

      const areaResponce = {...newArea};

      res.status(201).json(
        successResponse(areaResponce, 'area agregada exitosamente')
      );
    } catch(error){
      console.error('Error agregando area:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getAreas(req, res) {
    try {
      const areas =await fileManager.readTable('areas');

      const areasResponce = areas.map(area => {
        const safeArea = { ...area };
        return safeArea;
      });

      res.json(
        successResponse(areasResponce, `${areasResponce.length} areas encontrados`)
      );
    } catch(error){
      console.error('Error obteniendo areas:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getAreasById(req, res) {
    try {
      const { id } = req.params;

      const areas = await fileManager.readTable('areas');
      
      const area = areas.find(s => s.id === id);

      if (!area) {
        return res.status(404).json(
          errorResponse('area no encontrada')
        );
      }

      const areaById = { ...area };

      res.json(
        successResponse(areaById, 'Objeto obtenido')
      );
    } catch(error) {
      console.error('Error obteniendo producto por id', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async updateArea(req, res) {
    try {
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para realizar esta accion')
        );
      }

      const { id } = req.params;
      const areaData = req.body;

      const areas = await fileManager.readTable('areas');      
      const areaIndex = areas.findIndex(s => s.id === id);

      if (areaIndex === -1) {
        return res.status(404).json(
          errorResponse('area no encontrada')
        );
      }

      const area = areas[areaIndex];

      const updateArea = {
        ...area,
        nombre: areaData.nombre || area.nombre,
        descripcion: areaData.descripcion || area.descripcion,
        updatedAt: new Date().toISOString()
      };

      await fileManager.updateInTable ('areas', id, updateArea)

      // Responder sin contraseña
      const areaResponce = { ...updateArea };

      res.json(
        successResponse(areaResponce, 'Objeto obtenido')
      );
    } catch(error) {
      console.error('Error obteniendo area por id', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async deleteArea(req, res) {
    try{
      if (req.user.rol == 'cliente') {
        return res.status(403).json(
          errorResponse('No tienes permisos para esta accion')
        );
      }

      const { id } = req.params;
      
      // Buscar usuario
      const areas = await fileManager.readTable('areas');
      const areaIndex = areas.findIndex(s => s.id === id);

      if (areaIndex === -1) {
        return res.status(404).json(errorResponse('registro no encontrado'));
      }

      await fileManager.removeFromTable ('areas', id);

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

module.exports = areasController;