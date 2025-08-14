const fileManager = require('./utils/fileManager');
const { successResponse, errorResponse } = require('./utils/responseHelper');

const reportsController = {
  async getSalesReport(req, res) {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      // Cargar tablas necesarias
      await fileManager.ensureTable('orders');
      await fileManager.ensureTable('order_products');
      await fileManager.ensureTable('products');
      await fileManager.ensureTable('users');

      const orders = await fileManager.readTable('orders');
      const orderProducts = await fileManager.readTable('order_products');
      const products = await fileManager.readTable('products');
      const users = await fileManager.readTable('users');

      // Filtrar pedidos según el rol
      let filteredOrders;
      if (role === 'admin') {
        filteredOrders = orders;
      } else if (role === 'vendedor') {
        const sellerProductIds = products
          .filter(p => p.vendedorId === userId)
          .map(p => p.id);

        filteredOrders = orders.filter(order =>
          orderProducts
            .filter(op => op.orderId === order.id)
            .some(op => sellerProductIds.includes(op.productId))
        );
      } else {
        return res.status(403).json(errorResponse('Acceso denegado'));
      }

      // Calcular ventas totales
      const totalSales = filteredOrders.reduce((acc, o) => acc + o.precioTotal, 0);

      // Pedidos totales
      const totalOrders = filteredOrders.length;

      // Productos más vendidos
      const productSalesCount = {};
      filteredOrders.forEach(order => {
        const orderItems = orderProducts.filter(op => op.orderId === order.id);
        orderItems.forEach(item => {
          productSalesCount[item.productId] = (productSalesCount[item.productId] || 0) + item.cantidad;
        });
      });

      const topProducts = Object.entries(productSalesCount)
        .map(([productId, totalSold]) => {
          const product = products.find(p => p.id === productId);
          return {
            productId,
            nombre: product ? product.nombre : 'Producto eliminado',
            totalSold
          };
        })
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      // Usuarios registrados (solo admin)
      const totalUsers = role === 'admin' ? users.length : undefined;

      // Respuesta final
      res.json(successResponse({
        totalSales,
        totalOrders,
        topProducts,
        totalUsers
      }, 'Reporte de ventas generado correctamente'));

    } catch (error) {
      console.error('Error generando reporte de ventas:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async getMonthlySales(req, res) {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      await fileManager.ensureTable('orders');
      await fileManager.ensureTable('order_products');
      await fileManager.ensureTable('products');

      const orders = await fileManager.readTable('orders');
      const orderProducts = await fileManager.readTable('order_products');
      const products = await fileManager.readTable('products');

      // Filtrar según el rol
      let filteredOrders;
      if (role === 'admin') {
        filteredOrders = orders;
      } else if (role === 'vendedor') {
        const sellerProductIds = products
          .filter(p => p.vendedorId === userId)
          .map(p => p.id);

        filteredOrders = orders.filter(order =>
          orderProducts
            .filter(op => op.orderId === order.id)
            .some(op => sellerProductIds.includes(op.productId))
        );
      } else {
        return res.status(403).json(errorResponse('Acceso denegado'));
      }

      // Agrupar ventas por mes
      const monthlyData = {};
      filteredOrders.forEach(order => {
        const month = new Date(order.createdAt).toISOString().slice(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + order.precioTotal;
      });

      const monthlySales = Object.entries(monthlyData).map(([month, total]) => ({
        month,
        total
      }));

      res.json(successResponse(monthlySales, 'Ventas mensuales generadas correctamente'));

    } catch (error) {
      console.error('Error generando ventas mensuales:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async getOutOfStockProducts(req, res) {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      await fileManager.ensureTable('products');

      const products = await fileManager.readTable('products');

      let filteredProducts;
      if (role === 'admin') {
        filteredProducts = products.filter(p => p.stock <= 0);
      } else if (role === 'vendedor') {
        filteredProducts = products.filter(
          p => p.vendedorId === userId && p.stock <= 0
        );
      } else {
        return res.status(403).json(errorResponse('Acceso denegado'));
      }

      res.json(
        successResponse(filteredProducts, `${filteredProducts.length} productos sin stock`)
      );
    } catch (error) {
      console.error('Error generando reporte de productos sin stock:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async getTopCustomers(req, res) {
    try {
      const role = req.user.role;

      if (role !== 'admin') {
        return res.status(403).json(errorResponse('Acceso denegado'));
      }

      await fileManager.ensureTable('orders');
      await fileManager.ensureTable('users');

      const orders = await fileManager.readTable('orders');
      const users = await fileManager.readTable('users');

      const customerStats = {};

      orders.forEach(order => {
        if (!customerStats[order.usuarioId]) {
          customerStats[order.usuarioId] = { totalSpent: 0, ordersCount: 0 };
        }
        customerStats[order.usuarioId].totalSpent += order.precioTotal;
        customerStats[order.usuarioId].ordersCount += 1;
      });

      const topCustomers = Object.entries(customerStats)
        .map(([userId, stats]) => {
          const user = users.find(u => u.id === userId);
          return {
            userId,
            nombre: user ? `${user.nombre} ${user.apellido}` : 'Usuario eliminado',
            email: user ? user.email : 'N/A',
            totalSpent: stats.totalSpent,
            ordersCount: stats.ordersCount
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      res.json(
        successResponse(topCustomers, 'Top clientes por gasto total')
      );
    } catch (error) {
      console.error('Error generando reporte de clientes:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }
};

module.exports = reportsController;