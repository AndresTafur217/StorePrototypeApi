const fileManager = require('../utils/fileManager');
const { generateId } = require('../utils/idGenerator');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const notificationsController = require('./notificationsController');

const invoicesController = {
  // Crear factura
  async createInvoice(order) {
    await fileManager.ensureTable('invoices');

    const newInvoice = {
      id: generateId(),
      orderId: order.id,
      usuarioId: order.usuarioId,
      montoTotal: order.precioTotal,
      fecha: new Date().toISOString(),
      metodoPago: null, // aún no definido
      estadoPago: 'pendiente',
      fechaPago: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const invoices = await fileManager.readTable('invoices');
    invoices.push(newInvoice);
    await fileManager.writeTable('invoices', invoices);

    await notificationsController.createNotification({
      body: {
        usuarioId,
        mensaje: `Factura #${invoiceId} generada. Estado: pendiente de pago`,
        tipo: 'info'
      }
    }, { status: () => ({ json: () => {} }) });

    return newInvoice;
  },

  // Obtener facturas de un usuario
  async getInvoices(req, res) {
    try {
      const usuarioId = req.user.id;
      const rol = req.user.rol;
      const invoices = await fileManager.readTable('invoices');

      let filteredInvoices;

      if (rol === 'admin') {
        filteredInvoices = invoices; // ve todo
      } 
      else if (rol === 'vendedor') {
        // Buscar facturas que contengan productos del vendedor
        const orders = await fileManager.readTable('orders');
        const orderProducts = await fileManager.readTable('order_products');
        const products = await fileManager.readTable('products');

        const sellerProductIds = products
          .filter(p => p.vendedorId === usuarioId)
          .map(p => p.id);

        const ordersWithSellerProducts = orders
          .filter(order =>
            orderProducts
              .filter(op => op.orderId === order.id)
              .some(op => sellerProductIds.includes(op.productId))
          )
          .map(order => order.id);

        filteredInvoices = invoices.filter(inv =>
          ordersWithSellerProducts.includes(inv.orderId)
        );
      } 
      else {
        // cliente → solo sus facturas
        filteredInvoices = invoices.filter(inv => inv.usuarioId === usuarioId);
      }
      res.json(
        successResponse(userInvoices, `${userInvoices.length} facturas encontradas`)
      );
    } catch (error) {
      console.error('Error obteniendo facturas:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  // Pagar factura
  async payInvoice(req, res) {
    try {
      const { id } = req.params;
      const { metodoPago } = req.body;

      const invoices = await fileManager.readTable('invoices');
      const invoiceIndex = invoices.findIndex(inv => inv.id === id);

      if (invoiceIndex === -1) {
        return res.status(404).json(errorResponse('Factura no encontrada'));
      }

      const invoice = invoices[invoiceIndex];
      if (invoice.estadoPago === 'pagado') {
        return res.status(400).json(errorResponse('La factura ya está pagada'));
      }

      invoices[invoiceIndex].metodoPago = metodoPago || 'No especificado';
      invoices[invoiceIndex].estadoPago = 'pagado';
      invoices[invoiceIndex].fechaPago = new Date().toISOString();
      invoices[invoiceIndex].updatedAt = new Date().toISOString();

      await fileManager.writeTable('invoices', invoices);

      // Opcional: actualizar estado del pedido
      const orders = await fileManager.readTable('orders');
      const orderIndex = orders.findIndex(o => o.id === invoice.orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].estado = 'pagado';
        orders[orderIndex].updatedAt = new Date().toISOString();
        await fileManager.writeTable('orders', orders);
      }

      res.json(successResponse(invoices[invoiceIndex], 'Factura pagada exitosamente'));
    } catch (error) {
      console.error('Error pagando factura:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  async filterInvoices(req, res) {
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

      const invoices = await fileManager.readTable('invoices');

      const filteredInvs = invoices
        .filter(inv => 
          inv.usuarioId === userId &&
          new Date(inv.createdAt) >= startDate &&
          new Date(inv.createdAt) <= endDate
        );

      res.json(
        successResponse(filteredInvs, `${filteredInvs.length} facturas encontrados en el rango`)
      );

    } catch (error) {
      console.error('Error filtrando facturas por fecha:', error);
      res.status(500).json(
        errorResponse('Error interno del servidor')
      );
    }
  }
};

module.exports = invoicesController;