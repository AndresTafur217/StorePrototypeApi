const fileManager = require('./utils/fileManager');
const { generateId } = require('./utils/idGenerator');
const { successResponse, errorResponse } = require('./utils/responseHelper');
const auth = require('./middleware/authUser');

const favoritesController = {
  // Agregar producto favorito
  async addFavorite(req, res) {
    try {
      await fileManager.ensureTable('favorites');
      await fileManager.ensureTable('products');

      const { productId } = req.body;
      const userId = req.user.id;

      if (!productId) {
        return res.status(400).json(
          errorResponse('El campo productId es obligatorio')
        );
      }

      // Verificar que el producto exista
      const products = await fileManager.readTable('products');
      const productExists = products.find(p => p.id === productId);

      if (!productExists) {
        return res.status(404).json(
          errorResponse('Producto no encontrado')
        );
      }

      // Verificar que no esté ya en favoritos
      const favorites = await fileManager.readTable('favorites');
      const alreadyFav = favorites.find(
        fav => fav.usuarioId === userId && fav.productoId === productId
      );

      if (alreadyFav) {
        return res.status(409).json(
          errorResponse('El producto ya está en favoritos')
        );
      }

      const newFavorite = {
        id: generateId(),
        usuarioId: userId,
        productoId: productId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      favorites.push(newFavorite);
      await fileManager.writeTable('favorites', favorites);

      res.status(201).json(
        successResponse(newFavorite, 'Producto agregado a favoritos')
      );

    } catch (error) {
      console.error('Error agregando favorito:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  // Obtener y listar productos guardados
  async getFavorites(req, res) {
    try {
      const userId = req.user.id; // Solo favoritos del usuario autenticado
      const favorites = await fileManager.readTable('favorites');
      const products = await fileManager.readTable('products');

      // Filtrar favoritos del usuario y traer datos completos del producto
      const userFavs = favorites
        .filter(fav => fav.usuarioId === userId)
        .map(fav => {
          const product = products.find(p => p.id === fav.productoId);
          return {
            ...fav,
            producto: product || null
          };
        });

      res.json(
        successResponse(userFavs, `${userFavs.length} favoritos encontrados`)
      );

    } catch (error) {
      console.error('Error obteniendo favoritos:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  // Eliminar producto de favorito
  async deleteFavorite(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const favorites = await fileManager.readTable('favorites');
      const favIndex = favorites.findIndex(
        fav => fav.id === id && fav.usuarioId === userId
      );

      if (favIndex === -1) {
        return res.status(404).json(errorResponse('Favorito no encontrado'));
      }

      favorites.splice(favIndex, 1);
      await fileManager.writeTable('favorites', favorites);

      res.json(
        successResponse(null, 'Favorito eliminado exitosamente')
      );

    } catch (error) {
      console.error('Error eliminando favorito:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  // Filtrar favoritos guardados en un rango de fecha
  async filterFavorites(req, res) {
    try {
      const userId = req.user.id;
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json(
          errorResponse('Debes enviar start y end en el query')
        );
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json(
          errorResponse('Fechas inválidas, usa formato YYYY-MM-DD o ISO')
        );
      }

      const favorites = await fileManager.readTable('favorites');
      const products = await fileManager.readTable('products');

      const filteredFavs = favorites
        .filter(fav => 
          fav.usuarioId === userId &&
          new Date(fav.createdAt) >= startDate &&
          new Date(fav.createdAt) <= endDate
        )
        .map(fav => {
          const product = products.find(p => p.id === fav.productoId);
          return {
            ...fav,
            producto: product || null
          };
        });

      res.json(
        successResponse(filteredFavs, `${filteredFavs.length} favoritos encontrados en el rango`)
      );

    } catch (error) {
      console.error('Error filtrando favoritos por fecha:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  }
};

module.exports = favoritesController;