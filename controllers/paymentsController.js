const fileManager = require('../utils/fileManager');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const stripeService = require('../services/payments/stripeService');
const paypalService = require('../services/payments/paypalService');
const pseService = require('../services/payments/pseService');

const paymentsController = {
  async createPayment(req, res) {
    try {
      const { orderId, metodo, datosPago } = req.body;
      const usuarioId = req.user.id; // para la notificación

      if (!orderId || !metodo || !datosPago) {
        return res.status(400).json(
          errorResponse('orderId, metodo y datosPago son obligatorios')
        );
      }

      // Buscar pedido
      const orders = await fileManager.readTable('orders');
      const order = orders.find(o => o.id === orderId);

      if (!order) {
        return res.status(404).json(errorResponse('Pedido no encontrado'));
      }

      if (order.estado === 'pagado') {
        return res.status(400).json(errorResponse('El pedido ya está pagado'));
      }

      let pagoExitoso = false;

      // Seleccionar pasarela
      if (metodo === 'stripe') {
        pagoExitoso = await stripeService.procesarPago(order, datosPago);
      } else if (metodo === 'paypal') {
        pagoExitoso = await paypalService.procesarPago(order, datosPago);
      } else if (metodo === 'pse') {
        pagoExitoso = await pseService.procesarPago(order, datosPago);
      } else {
        return res.status(400).json(errorResponse('Método de pago no soportado'));
      }

      // Si el pago se confirma
      if (pagoExitoso) {
        order.estado = 'pagado';
        order.updatedAt = new Date().toISOString();
        await fileManager.writeTable('orders', orders);

        // Leer productos del pedido desde order_products
        const orderProducts = await fileManager.readTable('order_products');
        const products = await fileManager.readTable('products');

        const productosEnPedido = orderProducts.filter(op => op.orderId === order.id);

        productosEnPedido.forEach(op => {
          const product = products.find(p => p.id === op.productId);
          if (product) {
            product.stock = Math.max(0, product.stock - op.cantidad);
            product.estado = product.stock > 0 ? 'disponible' : 'agotado';
            product.updatedAt = new Date().toISOString();
          }
        });

        await fileManager.writeTable('products', products);

        // Notificar al usuario
        await notificationsController.createNotification({
          body: {
            usuarioId,
            mensaje: `Tu pago por el pedido #${orderId} se ha procesado con éxito`,
            tipo: 'success'
          }
        }, { status: () => ({ json: () => {} }) });

        return res.status(200).json(
          successResponse(order, 'Pago realizado y stock actualizado')
        );
      } else {
        return res.status(400).json(errorResponse('El pago no fue exitoso'));
      }

    } catch (error) {
      console.error('Error procesando pago:', error);
      return res.status(500).json(
        errorResponse('Error interno procesando el pago')
      );
    }
  }
};

module.exports = paymentsController;