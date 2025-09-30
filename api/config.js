module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
window.CONFIG = {
  API_BASE_URL: '', // Use relative URLs for same-domain deployment
  STRIPE_PUBLISHABLE_KEY: '${process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here'}'
};
  `);
};
