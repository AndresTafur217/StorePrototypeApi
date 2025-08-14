const axios = require('axios');

module.exports = {
  async procesarPago(order, datosPago) {
    try {
      const response = await axios.post('https://api.secure.payco.co/payment/pse', {
        amount: order.precioTotal,
        currency: 'COP',
        bank: datosPago.bankCode,
        invoice: order.id,
        description: 'Pago de pedido',
        name: datosPago.name,
        last_name: datosPago.lastName,
        email: datosPago.email,
        // Otros campos requeridos por PSE
      }, {
        headers: {
          Authorization: `Bearer ${process.env.EPAYCO_PRIVATE_KEY}`
        }
      });

      // Dependerá de cómo PSE responda
      return response.data.success === true;
    } catch (error) {
      console.error('Error en PSE:', error.response?.data || error);
      return false;
    }
  }
};