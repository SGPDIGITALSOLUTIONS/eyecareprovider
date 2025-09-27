require 'stripe'
require 'sinatra'
require 'dotenv/load'

# SECURITY: API keys loaded from environment variables - NEVER commit API keys to code!
Stripe.api_key = ENV['STRIPE_SECRET_KEY'] || raise('STRIPE_SECRET_KEY environment variable not set!')

set :static, true
set :port, ENV['PORT'] || 4242
set :public_folder, File.dirname(__FILE__) + '/'

# SECURITY: Domain loaded from environment variable
YOUR_DOMAIN = ENV['DOMAIN'] || 'http://localhost:4242'

post '/create-checkout-session' do
  # Handle both JSON and form data
  if request.content_type&.include?('application/json')
    request.body.rewind
    data = JSON.parse(request.body.read)
    customer_email = data['customer_email']
  else
    customer_email = params['customer_email']
  end
  
  begin
    # Create checkout session for Advanced Eye Care Plan
    session = Stripe::Checkout::Session.create({
      mode: 'subscription',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Advanced Eye Care Plan',
            description: 'Monthly subscription for comprehensive home eye care services with 25% discounts, WhatsApp support, and priority booking.',
          },
          unit_amount: 1500, # £15.00 in pence
          recurring: {
            interval: 'month',
          },
        },
      }],
      success_url: YOUR_DOMAIN + '/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: YOUR_DOMAIN + '/cancel.html',
      customer_email: customer_email, # Optional: pre-fill email
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        plan_type: 'advanced_eye_care',
        commitment_months: '12'
      }
    })
    
    # Return JSON for AJAX requests, redirect for form submissions
    if request.content_type&.include?('application/json')
      content_type 'application/json'
      { checkout_url: session.url }.to_json
    else
      redirect session.url, 303
    end
    
  rescue Stripe::StripeError => e
    if request.content_type&.include?('application/json')
      status 400
      content_type 'application/json'
      { error: { message: e.message } }.to_json
    else
      halt 400, "Stripe Error: #{e.message}"
    end
  rescue StandardError => e
    if request.content_type&.include?('application/json')
      status 500
      content_type 'application/json'
      { error: { message: 'An unexpected error occurred.' } }.to_json
    else
      halt 500, "Error: An unexpected error occurred."
    end
  end
end

post '/create-portal-session' do
  content_type 'application/json'
  
  begin
    # For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
    # Typically this is stored alongside the authenticated user in your database.
    checkout_session_id = params['session_id']
    checkout_session = Stripe::Checkout::Session.retrieve(checkout_session_id)

    # This is the URL to which users will be redirected after they're done managing their billing.
    return_url = YOUR_DOMAIN + '/advanced-eyecare-plan.html'

    session = Stripe::BillingPortal::Session.create({
      customer: checkout_session.customer,
      return_url: return_url
    })
    
    { portal_url: session.url }.to_json
  rescue Stripe::StripeError => e
    status 400
    { error: { message: e.message } }.to_json
  rescue StandardError => e
    status 500
    { error: { message: 'An unexpected error occurred.' } }.to_json
  end
end

post '/webhook' do
  # SECURITY: Webhook secret loaded from environment variable - NEVER commit secrets to code!
  webhook_secret = ENV['STRIPE_WEBHOOK_SECRET'] || ''
  payload = request.body.read
  
  if !webhook_secret.empty?
    # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, webhook_secret
      )
    rescue JSON::ParserError => e
      # Invalid payload
      puts '⚠️  Invalid JSON payload'
      status 400
      return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      puts '⚠️  Webhook signature verification failed.'
      status 400
      return
    end
  else
    data = JSON.parse(payload, symbolize_names: true)
    event = Stripe::Event.construct_from(data)
  end
  
  # Get the type of webhook event sent - used to check the status of PaymentIntents.
  event_type = event['type']
  data = event['data']
  data_object = data['object']

  case event.type
  when 'customer.subscription.created'
    # Handle new subscription created
    puts "✅ New Advanced Eye Care Plan subscription created: #{data_object['id']}"
    puts "   Customer: #{data_object['customer']}"
    puts "   Amount: £#{data_object['items']['data'][0]['price']['unit_amount'] / 100}"
    
    # TODO: Add customer to your database, send welcome email, etc.
    
  when 'customer.subscription.updated'
    # Handle subscription updated (plan changes, etc.)
    puts "🔄 Subscription updated: #{data_object['id']}"
    puts "   Status: #{data_object['status']}"
    
  when 'customer.subscription.deleted'
    # Handle subscription canceled
    puts "❌ Subscription canceled: #{data_object['id']}"
    puts "   Customer: #{data_object['customer']}"
    
    # TODO: Remove customer access, send cancellation email, etc.
    
  when 'customer.subscription.trial_will_end'
    # Handle subscription trial ending (if you add trials later)
    puts "⏰ Subscription trial will end: #{data_object['id']}"
    
  when 'invoice.payment_succeeded'
    # Handle successful payment
    puts "💰 Payment succeeded for subscription: #{data_object['subscription']}"
    puts "   Amount paid: £#{data_object['amount_paid'] / 100}"
    
  when 'invoice.payment_failed'
    # Handle failed payment
    puts "💳 Payment failed for subscription: #{data_object['subscription']}"
    puts "   Customer: #{data_object['customer']}"
    
    # TODO: Send payment failed email, retry logic, etc.
    
  else
    puts "🔍 Unhandled event type: #{event.type}"
  end

  content_type 'application/json'
  { status: 'success' }.to_json
end

# Serve static files
get '/' do
  redirect '/advanced-eyecare-plan.html'
end
