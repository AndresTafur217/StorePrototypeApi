const paypal = require('@paypal/checkout-server-sdk');

// Configuración PayPal
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = {
  async procesarPago(order, datosPago) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(datosPago.orderId);
      request.requestBody({});
      const response = await client.execute(request);
      return response.result.status === 'COMPLETED';
    } catch (error) {
      console.error('Error en PayPal:', error);
      return false;
    }
  }
};