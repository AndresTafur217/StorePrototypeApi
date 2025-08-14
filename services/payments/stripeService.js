const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = {
  async procesarPago(order, datosPago) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.precioTotal * 100),
        currency: 'usd',
        payment_method: datosPago.paymentMethodId,
        confirm: true
      });

      return paymentIntent.status === 'succeeded';
    } catch (error) {
      console.error('Error en Stripe:', error);
      return false;
    }
  }
};