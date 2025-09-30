module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
window.CONFIG = {
  API_BASE_URL: '${process.env.API_DOMAIN || process.env.DOMAIN || 'https://api.eyecareprovider.co.uk'}',
  STRIPE_PUBLISHABLE_KEY: '${process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here'}'
};
  `);
};
