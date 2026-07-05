const { sendContactEmail } = require('../lib/contact-email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const result = await sendContactEmail(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Contact form error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Email failed to send.',
    });
  }
};
