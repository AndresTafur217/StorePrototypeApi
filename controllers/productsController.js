const fileManager = require('./utils/fileManager');
const { generateId } = require('./utils/idGenerator');
const { successResponse, errorResponse } = require('./utils/responseHelper');
const auth = require('./middleware/authUser');

function calcularEstado(stock) {
  if (stock === 0) return 'agotado';
  if (stock < 10) return 'casi agotado';
  return 'disponible';
}

const productController = {
  async addProduct(req, res) {
    try {
      await fileManager.ensureTable('products');
      await fileManager.ensureTable('product_specifications');

      const {
        tipo,
        area,
        nombre,
        descripcion,
        especificaciones = [],
        stok,
        precio,
        estado,
        vendedor
      } = req.body;

      if (!tipo || !area || !nombre || !descripcion || !precio) {
        return res.status(400).json(
          errorResponse('Todos los campos son obligatorios')
        );
      }

      const newProduct = {
        id: generateId(),
        tipo: tipo.trim(),
        area: area.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        stok: stok,
        precio: precio,
        estado: calcularEstado(req.body.stock),
        vendedor: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const products = await fileManager.readTable('products');
      products.push(newProduct);
      await fileManager.writeTable('products', products);

      const productSpecs = await fileManager.readTable('product_specifications');
      especificaciones.forEach(specId => {
        productSpecs.push({ productId: newProduct.id, specificationId: specId });
      });
      await fileManager.writeTable('product_specifications', productSpecs);

      res.status(201).json(
        successResponse(newProduct, 'Producto agregado exitosamente')
      );

    } catch(error) {
      console.error('Error agregando producto',error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getProducts(req, res) {
    try {
      const products = await fileManager.readTable('products');
      const specs = await fileManager.readTable('specifications');
      const productSpecs = await fileManager.readTable('product_specifications');

      const productsResponse = products.map(product => {
        const relatedSpecs = productSpecs
          .filter(ps => ps.productId === product.id)
          .map(ps => specs.find(s => s.id === ps.specificationId));
        return { ...product, especificaciones: relatedSpecs };
      });

      res.json(
        successResponse(productsResponse, `${productsResponse.length} Productos obtenidos`)
      );
    } catch (error) {
      console.error('Error obteniendo productos', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const products = await fileManager.readTable('products');
      const specs = await fileManager.readTable('specifications');
      const productSpecs = await fileManager.readTable('product_specifications');

      const product = products.find(p => p.id === id);

      if (!product) {
        return res.status(404).json(
          errorResponse('Producto no encontrado')
        );
      }

      const relatedSpecs = productSpecs
        .filter(ps => ps.productId === id)
        .map(ps => specs.find(s => s.id === ps.specificationId));

      res.json(
        successResponse({ ...product, especificaciones: relatedSpecs })
      );
    } catch(error) {
      console.error('Error obteniendo producto por id', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },
  
  async updateProduct(req, res) {
    try {
      const { id } = req.params;

      const {
        tipo, area, nombre, descripcion,
        especificaciones = [], stok, precio
      } = req.body;

      const products = await fileManager.readTable('product');
      const productIndex = products.findIndex(p => p.id === id);

      if (productIndex === -1) {
        return res.status(404).json(
          errorResponse('Producto no encontrado')
        );
      }

      products[productIndex] = {
        ...products[productIndex],
        tipo: tipo || products[productIndex].tipo,
        area: area || products[productIndex].area,
        nombre: nombre || products[productIndex].nombre,
        descripcion: descripcion || products[productIndex].descripcion,
        stok: stok !== undefined ? stok : products[productIndex].stok,
        estado: calcularEstado(stok !== undefined ? stok : products[productIndex].stok),
        precio: precio || products[productIndex].precio,
        updatedAt: new Date().toISOString()
      };

      await fileManager.writeTable('products', products);

      // Actualizar relaciones
      const productSpecs = await fileManager.readTable('product_specifications');
      const filtered = productSpecs.filter(ps => ps.productId !== id);
      especificaciones.forEach(specId => {
        filtered.push({ productId: id, specificationId: specId });
      });
      await fileManager.writeTable('product_specifications', filtered);

      res.status(200).json(
        successResponse(products[productIndex], 'Producto actualizado exitosamente')
      );
    } catch(error) {
      console.error('Error actualizando producto', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const products = await fileManager.readTable('products');
      const productIndex = products.findIndex(p => this.updateProduct.id === id);

      if (productIndex === -1) {
        return res.status(404).json(errorResponse('Producto no encontrado'));
      }

      products.splice(productIndex, 1);
      await fileManager.writeTable('products', products);

      // Eliminar relaciones
      const productSpecs = await fileManager.readTable('product_specifications');
      const filtered = productSpecs.filter(ps => ps.productId !== id);
      await fileManager.writeTable('product_specifications', filtered);

      res.status(204).json(
        successResponse('Producto eliminado exitosamente')
      );

    } catch(error) {
      if (error.message == 'registro no encontrado') {
        return res.status(404).json(
          errorResponse('Producto no encontrado')
        );
      }

      console.error('Error eliminando producto:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async searchProduct(req, res) {
    try {
      const { term } = req.params;

      const products = await fileManager.readTable('products');
      const filterdProducts = products.filter(product =>
        product.tipo.toLowerCase().includes(term.toLowerCase()) ||
        product.area.toLowerCase().includes(term.toLowerCase()) ||
        product.estado.toLowerCase().includes(term.toLowerCase()) ||
        product.precio.toLowerCase().includes(term.toLowerCase()) ||
        product.vendedor.toLowerCase().includes(term.toLowerCase())
      );
      
      const productsResponse = filterdProducts.map(product => {
        const productCopy = {...product};
        return productCopy;
      });

      res.json(
        successResponse(productsResponse, `${productsResponse.length} Productos obtenidos`)
      );

    } catch(error) {
      console.error('Error buscando producto:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  }
};

module.exports = productController;