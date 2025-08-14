const fileManager = require('../utils/fileManager');
const { generateId } = require('../utils/idGenerator');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const invoicesController = require('./invoicesController'); // nuevo
const notificationsController = require('./notificationsController');

const ordersController = {
  async addOrder(req, res) {
    try {
      await fileManager.ensureTable('orders');
      await fileManager.ensureTable('products');
      await fileManager.ensureTable('order_products');

      const { productos } = req.body;
      const usuarioId = req.user.id;

      if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json(
          errorResponse('Debes enviar al menos un producto')
        );
      }

      const productsTable = await fileManager.readTable('products');
      let precioTotal = 0;

      for (const item of productos) {
        const product = productsTable.find(p => p.id === item.productId);
        if (!product) {
          return res.status(404).json(
            errorResponse(`Producto con id ${item.productId} no encontrado`)
          );
        }
        precioTotal += product.precio * (item.cantidad || 1);
      }

      const newOrder = {
        id: generateId(),
        usuarioId,
        precioTotal,
        estado: 'pendiente',
        fecha: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const orders = await fileManager.readTable('orders');
      orders.push(newOrder);
      await fileManager.writeTable('orders', orders);

      const orderProducts = await fileManager.readTable('order_products');
      for (const item of productos) {
        orderProducts.push({
          id: generateId(),
          orderId: newOrder.id,
          productId: item.productId,
          cantidad: item.cantidad || 1
        });
      }
      await fileManager.writeTable('order_products', orderProducts);

      // Crear factura automáticamente
      const invoice = await invoicesController.createInvoice(newOrder);

      await notificationsController.createNotification({
        body: {
          usuarioId,
          mensaje: 'Tu pedido ha sido creado con éxito.',
          tipo: 'success'
        }
      }, { status: () => ({ json: () => {} }) });

      res.status(201).json(
        successResponse(
          { ...newOrder, productos, factura: invoice },
          'Pedido y factura creados exitosamente'
        )
      );
    } catch (error) {
      console.error('Error creando pedido:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async getOrders(req, res) {
    try {
      const userId = req.user.id;
      const rol = req.user.role;

      const orders = await fileManager.readTable('orders');
      const orderProducts = await fileManager.readTable('order_products');
      const productsTable = await fileManager.readTable('products');

      let filteredOrders;

      if (rol === 'admin') {
        filteredOrders = orders;
      } 
      else if (rol === 'vendedor') {
        const sellerProductIds = productsTable
          .filter(p => p.vendedorId === userId)
          .map(p => p.id);

        filteredOrders = orders.filter(order =>
          orderProducts
            .filter(op => op.orderId === order.id)
            .some(op => sellerProductIds.includes(op.productId))
        );
      } 
      else {
        filteredOrders = orders.filter(or => or.usuarioId === userId);
      }

      const ordersWithProducts = filteredOrders.map(order => {
        const productos = orderProducts
          .filter(op => op.orderId === order.id)
          .map(op => {
            const prod = productsTable.find(p => p.id === op.productId);
            return { ...op, producto: prod || null };
          });
        return { ...order, productos };
      });

      res.json(
        successResponse(ordersWithProducts, `${ordersWithProducts.length} pedidos encontrados`)
      );
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const orders = await fileManager.readTable('orders');
      const orderIndex = orders.findIndex(o => o.id === id);

      if (orderIndex === -1) {
        return res.status(404).json(
          errorResponse('Pedido no encontrado')
        );
      }

      orders[orderIndex].estado = estado || orders[orderIndex].estado;
      orders[orderIndex].updatedAt = new Date().toISOString();

      await fileManager.writeTable('orders', orders);

      if (product.stock <= 5) {
        await notificationsController.createNotification({
          body: {
            usuarioId: product.vendedorId,
            mensaje: `El producto "${product.nombre}" está por agotarse (stock: ${product.stock})`,
            tipo: 'warning'
          }
        }, { status: () => ({ json: () => {} }) });
      }
      if (product.stock === 0) {
        await notificationsController.createNotification({
          body: {
            usuarioId: product.vendedorId,
            mensaje: `El producto "${product.nombre}" se ha agotado`,
            tipo: 'error'
          }
        }, { status: () => ({ json: () => {} }) });
      }

      res.json(
        successResponse(orders[orderIndex], 'Estado del pedido actualizado')
      );
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      let orders = await fileManager.readTable('orders');
      const orderExists = orders.find(o => o.id === id);

      if (!orderExists) {
        return res.status(404).json(errorResponse('Pedido no encontrado'));
      }

      // Eliminar de orders
      orders = orders.filter(o => o.id !== id);
      await fileManager.writeTable('orders', orders);

      // Eliminar de order_products
      let orderProducts = await fileManager.readTable('order_products');
      orderProducts = orderProducts.filter(op => op.orderId !== id);
      await fileManager.writeTable('order_products', orderProducts);

      res.json(
        successResponse(null, 'Pedido eliminado exitosamente')
      );
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async filterOrders(req, res) {
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

      const orders = await fileManager.readTable('orders');

      const filteredOrders = orders
        .filter(or => 
          or.usuarioId === userId &&
          new Date(or.createdAt) >= startDate &&
          new Date(or.createdAt) <= endDate
        );

      res.json(
        successResponse(filteredOrders, `${filteredOrders.length} pedidos encontrados en el rango`)
      );

    } catch (error) {
      console.error('Error filtrando pedidos por fecha:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  },

  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const rol = req.user.role;

      // Leer tablas necesarias
      const orders = await fileManager.readTable('orders');
      const orderProducts = await fileManager.readTable('order_products');
      const productsTable = await fileManager.readTable('products');

      // Buscar pedido
      const orderIndex = orders.findIndex(o => o.id === id);
      if (orderIndex === -1) {
        return res.status(404).json(errorResponse('Pedido no encontrado'));
      }

      const order = orders[orderIndex];

      // Validar permisos
      if (rol !== 'admin' && order.usuarioId !== userId) {
        return res.status(403).json(errorResponse('No tienes permiso para cancelar este pedido'));
      }

      // Validar estado
      if (order.estado === 'cancelado') {
        return res.status(400).json(errorResponse('El pedido ya fue cancelado'));
      }

      // Si el pedido está pagado, restaurar stock
      if (order.estado === 'pagado') {
        const productosEnPedido = orderProducts.filter(op => op.orderId === id);

        productosEnPedido.forEach(op => {
          const product = productsTable.find(p => p.id === op.productId);
          if (product) {
            product.stock += op.cantidad;
            product.estado = 'disponible';
            product.updatedAt = new Date().toISOString();
          }
        });

        await fileManager.writeTable('products', productsTable);
      }

      // Actualizar estado del pedido
      order.estado = 'cancelado';
      order.updatedAt = new Date().toISOString();
      await fileManager.writeTable('orders', orders);

      return res.json(
        successResponse(order, 'Pedido cancelado correctamente')
      );

    } catch (error) {
      console.error('Error cancelando pedido:', error);
      return res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },
  
  async getSalesHistory(req, res) {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== 'vendedor' && role !== 'admin') {
      return res.status(403).json(errorResponse('No tienes permiso'));
    }

    const orders = await fileManager.readTable('orders');
    const orderProducts = await fileManager.readTable('order_products');
    const products = await fileManager.readTable('products');

    const myProductIds = products.filter(p => p.vendedorId === userId).map(p => p.id);

    const mySales = orders.filter(order => 
      order.estado === 'pagado' &&
      orderProducts.some(op => myProductIds.includes(op.productId) && op.orderId === order.id)
    );

    return res.json(successResponse(mySales, 'Historial de ventas obtenido'));
  }
};

module.exports = ordersController;