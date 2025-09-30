const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product_name, amount, currency, interval, customer_email } = req.body;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: currency || 'gbp',
          product_data: {
            name: product_name || 'Advanced Eye Care Plan',
            description: 'Monthly subscription for comprehensive home eye care services with 25% discounts, WhatsApp support, and priority booking.',
          },
          unit_amount: parseInt(amount) * 100 || 1500, // Convert to pence
          recurring: {
            interval: interval || 'month',
          },
        },
      }],
      success_url: `${process.env.DOMAIN || 'https://www.eyecareprovider.co.uk'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN || 'https://www.eyecareprovider.co.uk'}/cancel.html`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_email: customer_email || undefined,
      metadata: {
        plan_type: 'advanced_eye_care',
        commitment_months: '12'
      }
    });

    res.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(400).json({ error: { message: error.message } });
  }
};
