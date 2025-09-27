# Stripe Integration Setup for Advanced Eye Care Plan

This document provides complete **SECURE** setup instructions for the Stripe subscription integration.

## 🔒 **SECURITY FIRST APPROACH**

**⚠️ CRITICAL**: This integration uses environment variables for all sensitive data. **NEVER** commit API keys to your code repository!

## 🚀 Quick Start

### Prerequisites
- Ruby installed on your system
- Stripe account (free to create)
- Git repository access

### 1. Install Dependencies
```bash
bundle install
```

### 2. **SECURE** Configuration Setup

#### Get Your Stripe Keys:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers > API keys**
3. Copy your **Publishable key** (starts with `pk_`)
4. Copy your **Secret key** (starts with `sk_`)

#### **SECURE** Environment Setup:
1. **Copy the template**:
   ```bash
   cp env.example .env
   ```

2. **Edit .env file** (this file is gitignored for security):
   ```bash
   # .env file (NEVER commit this file!)
   STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   DOMAIN=http://localhost:4242
   ```

3. **Verify .env is gitignored**:
   ```bash
   git status  # .env should NOT appear in untracked files
   ```

### 3. Set Up Webhooks

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/webhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. **Add to your .env file**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
   ```

### 4. Run the Server
```bash
ruby server.rb -o 0.0.0.0
```

The server will start on `http://localhost:4242`

## 📋 Integration Details

### Subscription Details
- **Product**: Advanced Eye Care Plan
- **Price**: £15.00/month
- **Currency**: GBP
- **Billing**: Monthly recurring
- **Commitment**: 12 months minimum (handled in your business logic)

### Payment Flow
1. User clicks "Sign Up Now" button
2. JavaScript sends request to `/create-checkout-session`
3. Server creates Stripe Checkout Session
4. User redirected to Stripe-hosted payment page
5. After payment:
   - Success → `success.html`
   - Cancel → `cancel.html`

### Files Created/Modified
- `server.rb` - Ruby/Sinatra server with Stripe integration
- `Gemfile` - Ruby dependencies
- `success.html` - Post-payment success page
- `cancel.html` - Payment cancellation page
- `js/stripe-integration.js` - Updated frontend integration
- `css/styles.css` - Styles for success/cancel pages

## 🔧 Customization Options

### Modify Subscription Details
In `server.rb`, update the checkout session creation (lines 15-35):

```ruby
price_data: {
  currency: 'gbp',
  unit_amount: 1500, # £15.00 in pence
  product_data: {
    name: 'Advanced Eye Care Plan',
    description: 'Your description here',
  },
  recurring: {
    interval: 'month', # or 'year'
  },
}
```

### Add Customer Email Pre-fill
The integration automatically attempts to get customer email from any email input on the page.

### Enable Promotion Codes
Already enabled in the checkout session:
```ruby
allow_promotion_codes: true
```

## 🛡️ Security Considerations

1. **Environment Variables**: Move API keys to environment variables:
   ```ruby
   Stripe.api_key = ENV['STRIPE_SECRET_KEY']
   ```

2. **HTTPS Required**: Stripe requires HTTPS in production

3. **Webhook Verification**: The webhook endpoint verifies Stripe signatures

4. **Input Validation**: Server validates all incoming data

## 🚀 Production Deployment

### Environment Setup
1. **Production .env file**:
   ```bash
   # Production .env file (NEVER commit this!)
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   DOMAIN=https://yourdomain.com
   PORT=443
   ```

2. **Server already configured** to use environment variables securely!

### SSL/HTTPS
- Required for production
- Use services like Let's Encrypt for free SSL certificates

### Database Integration
Consider adding database storage for:
- Customer subscription status
- Payment history
- User management

## 🔍 Testing

### Test Cards
Use Stripe test cards for development:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Authentication Required**: 4000 0025 0000 3155

### Webhook Testing
Use Stripe CLI for local webhook testing:
```bash
stripe listen --forward-to localhost:4242/webhook
```

## 📞 Support

### Stripe Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

### Integration Issues
Check the server logs for detailed error messages. Common issues:
- Incorrect API keys
- Webhook signature verification failures
- Network connectivity problems

## 🔄 Next Steps

1. **Test the integration** with Stripe test cards
2. **Customize success/cancel pages** as needed
3. **Set up webhook endpoints** for subscription management
4. **Add customer database** for user management
5. **Deploy to production** with proper SSL certificates

---

**Important**: This integration is ready for testing. Replace test API keys with live keys when ready for production.
