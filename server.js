// Node.js Stripe Server - Alternative to Ruby
const express = require('express');
const stripe = require('stripe');
const path = require('path');
require('dotenv').config();

// Import email functionality
const { sendWelcomeEmail } = require('./email-config');

// Initialize Express app
const app = express();
const port = process.env.PORT || 4242;

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Enhanced CORS middleware with debugging
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://www.eyecareprovider.co.uk',
    'https://eyecareprovider.co.uk',
    'https://api.eyecareprovider.co.uk',
    'https://3bbec7964f72.ngrok-free.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500' // Live Server
  ];
  
  const origin = req.headers.origin;
  
  // Log CORS request for debugging
  console.log(`🌐 CORS Request: ${req.method} ${req.url}`);
  console.log(`   Origin: ${origin || 'No origin header'}`);
  
  // Always set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log(`   ✅ Allowed origin: ${origin}`);
  } else {
    // Allow all origins for now to fix the immediate issue
    res.header('Access-Control-Allow-Origin', '*');
    console.log(`   🔓 Using wildcard origin (origin: ${origin})`);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`   🚀 Handling OPTIONS preflight request`);
    res.status(200).end();
    return;
  }
  
  next();
});

// Your domain - dynamically set via GitHub variables
const YOUR_DOMAIN = process.env.DOMAIN || 'https://eyecareprovider.co.uk';

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Build session config
    const sessionConfig = {
      mode: 'subscription',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Advanced Eye Care Plan',
            description: 'Monthly subscription for comprehensive home eye care services with 25% discounts, WhatsApp support, and priority booking.',
          },
          unit_amount: 1500, // £15.00 in pence
          recurring: {
            interval: 'month',
          },
        },
      }],
      success_url: YOUR_DOMAIN + '/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: YOUR_DOMAIN + '/cancel.html',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        plan_type: 'advanced_eye_care',
        commitment_months: '12'
      }
    };

    // Only add customer_email if it's provided and valid
    if (req.body.customer_email && req.body.customer_email.trim()) {
      sessionConfig.customer_email = req.body.customer_email.trim();
    }

    const session = await stripeClient.checkout.sessions.create(sessionConfig);

    res.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(400).json({ error: { message: error.message } });
  }
});

// Create portal session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { session_id } = req.body;
    const checkoutSession = await stripeClient.checkout.sessions.retrieve(session_id);

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: checkoutSession.customer,
      return_url: YOUR_DOMAIN + '/advanced-eyecare-plan.html',
    });

    res.json({ portal_url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(400).json({ error: { message: error.message } });
  }
});

// Webhook endpoint (new API structure)
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
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
      await handleNewSubscription(event.data.object);
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
});

// Legacy webhook endpoint (backup)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('⚠️  Legacy webhook endpoint called - redirecting to new endpoint');
  // Redirect to the main webhook handler
  req.url = '/api/webhooks/stripe';
  return app._router.handle(req, res);
});

// Handle new subscription - send welcome email
async function handleNewSubscription(subscription) {
  try {
    console.log('🎉 Processing new Advanced Eye Care Plan subscription...');
    
    // Get customer details from Stripe
    const customer = await stripeClient.customers.retrieve(subscription.customer);
    
    if (customer.email) {
      console.log(`📧 Sending welcome email to: ${customer.email}`);
      
      // Extract customer name (use name from Stripe or default)
      const customerName = customer.name || customer.email.split('@')[0] || 'Valued Customer';
      
      // Send welcome email with WhatsApp details
      const emailResult = await sendWelcomeEmail(customer.email, customerName);
      
      if (emailResult.success) {
        console.log('✅ Welcome email sent successfully!');
        console.log(`   📧 To: ${customer.email}`);
        console.log(`   👤 Name: ${customerName}`);
        console.log(`   📨 Message ID: ${emailResult.messageId}`);
      } else {
        console.error('❌ Failed to send welcome email:', emailResult.error);
      }
    } else {
      console.log('⚠️  No email address found for customer');
    }
    
    // Log subscription details
    console.log('📋 Subscription Details:');
    console.log(`   🆔 ID: ${subscription.id}`);
    console.log(`   👤 Customer: ${customer.email || customer.id}`);
    console.log(`   💰 Amount: £${subscription.items.data[0].price.unit_amount / 100}/month`);
    console.log(`   📅 Started: ${new Date(subscription.created * 1000).toLocaleDateString()}`);
    
  } catch (error) {
    console.error('❌ Error handling new subscription:', error);
  }
}

// Test endpoint to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/api/webhooks/stripe',
      checkout: '/api/create-checkout-session',
      portal: '/api/create-portal-session'
    }
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

app.options('/api/cors-test', (req, res) => {
  res.status(200).end();
});

// Serve static files
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Stripe integration ready!`);
  console.log(`🔗 Visit: http://localhost:${port}/advanced-eyecare-plan.html`);
});

module.exports = app;
