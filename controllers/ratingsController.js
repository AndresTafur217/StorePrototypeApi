const fileManager = require('./utils/fileManager');
const { generateId } = require('./utils/idGenerator');
const { successResponse, errorResponse } = require('./utils/responseHelper');

const ratingsController = {
  // Crear valoración
  async addRating(req, res) {
    try {
      await fileManager.ensureTable('ratings');
      await fileManager.ensureTable('products');
      await fileManager.ensureTable('users');

      const { productoId, estrellas, comentario } = req.body;

      // Validar campos
      if (!productoId || !estrellas) {
        return res.status(400).json(
          errorResponse('productoId y estrellas son obligatorios')
        );
      }
      if (estrellas < 1 || estrellas > 5) {
        return res.status(400).json(
          errorResponse('Las estrellas deben estar entre 1 y 5')
        );
      }

      // Verificar que el producto exista
      const products = await fileManager.readTable('products');
      const producto = products.find(p => p.id === productoId);
      if (!producto) {
        return res.status(404).json(
          errorResponse('Producto no encontrado')
        );
      }

      // Crear la valoración
      const newRating = {
        id: generateId(),
        usuarioId: req.user.id, // cliente autenticado
        productoId,
        vendedorId: producto.vendedor,
        estrellas,
        comentario: comentario || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ratings = await fileManager.readTable('ratings');
      ratings.push(newRating);
      await fileManager.writeTable('ratings', ratings);

      // Recalcular valoración promedio del vendedor
      const ratingsVendedor = ratings.filter(r => r.vendedorId === producto.vendedor);
      const promedio = ratingsVendedor.reduce((sum, r) => sum + r.estrellas, 0) / ratingsVendedor.length;

      // Actualizar el usuario vendedor
      const users = await fileManager.readTable('users');
      const vendedorIndex = users.findIndex(u => u.id === producto.vendedor);
      if (vendedorIndex !== -1) {
        users[vendedorIndex].valoracionPromedio = promedio.toFixed(2);
        await fileManager.writeTable('users', users);
      }

      await notificationsController.createNotification({
        body: {
          usuarioId: vendedorId,
          mensaje: `⭐ Has recibido una nueva valoración en tu producto "${product.nombre}"`,
          tipo: 'info'
        }
      }, { status: () => ({ json: () => {} }) });

      res.status(201).json(
        successResponse(newRating, 'Valoración agregada exitosamente')
      );
    } catch (error) {
      console.error('Error agregando valoración:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  // Obtener valoraciones de un producto
  async getRatingsByProduct(req, res) {
    try {
      const { productoId } = req.params;
      const ratings = await fileManager.readTable('ratings');
      const filtradas = ratings.filter(r => r.productoId === productoId);

      res.json(
        successResponse(filtradas, `${filtradas.length} valoraciones encontradas`)
      );
    } catch (error) {
      console.error('Error obteniendo valoraciones:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  // Obtener valoraciones de un vendedor
  async getRatingsBySeller(req, res) {
    try {
      const { vendedorId } = req.params;
      const ratings = await fileManager.readTable('ratings');
      const filtradas = ratings.filter(r => r.vendedorId === vendedorId);

      res.json(
        successResponse(filtradas, `${filtradas.length} valoraciones encontradas`)
      );
    } catch (error) {
      console.error('Error obteniendo valoraciones de vendedor:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  }
};

module.exports = ratingsController;
