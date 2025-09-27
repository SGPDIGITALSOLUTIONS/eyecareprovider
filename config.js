// Public configuration file - safe to commit to Git
// This file contains NO secret keys - only public configuration

module.exports = {
  // Stripe Public Configuration
  stripe: {
    // This is your PUBLISHABLE key - safe to expose publicly
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here',
    
    // Product Configuration
    product: {
      name: 'Advanced Eye Care Plan',
      description: 'Monthly subscription for comprehensive home eye care services with 25% discounts, WhatsApp support, and priority booking.',
      price: 1500, // £15.00 in pence
      currency: 'gbp',
      interval: 'month'
    }
  },
  
  // Server Configuration
  server: {
    port: process.env.PORT || 4242,
    domain: process.env.DOMAIN || 'http://localhost:4242'
  }
};

