module.exports = (req, res) => {
  // Test if Stripe key is available
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
  const stripeKeyPreview = process.env.STRIPE_SECRET_KEY ? 
    process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'NOT SET';

  res.status(200).json({
    status: 'Stripe Test',
    method: req.method,
    hasStripeKey: hasStripeKey,
    stripeKeyPreview: stripeKeyPreview,
    body: req.body,
    timestamp: new Date().toISOString()
  });
};
