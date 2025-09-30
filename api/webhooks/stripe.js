const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('✅ New subscription created:', event.data.object.id);
      // Handle new subscription
      break;
    case 'customer.subscription.updated':
      console.log('🔄 Subscription updated:', event.data.object.id);
      break;
    case 'customer.subscription.deleted':
      console.log('❌ Subscription canceled:', event.data.object.id);
      break;
    case 'invoice.payment_succeeded':
      console.log('💰 Payment succeeded:', event.data.object.subscription);
      break;
    case 'invoice.payment_failed':
      console.log('💳 Payment failed:', event.data.object.subscription);
      break;
    default:
      console.log(`🔍 Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};
