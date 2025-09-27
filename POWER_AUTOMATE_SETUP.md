# Power Automate Email Automation Setup (Recommended)

## 🚀 Why Power Automate is Better

**Security Benefits:**
- ✅ No email credentials stored in your code
- ✅ Enterprise-grade Microsoft security
- ✅ OAuth authentication (no passwords)
- ✅ Audit trails and compliance
- ✅ Easy to manage and update

**Operational Benefits:**
- ✅ Visual workflow designer
- ✅ Built-in email templates
- ✅ Error handling and retry logic
- ✅ Monitoring and analytics
- ✅ No server maintenance needed

## 📋 Setup Steps

### Step 1: Create Power Automate Flow

1. **Go to [Power Automate](https://make.powerautomate.com/)**
2. **Sign in** with your Microsoft/Office 365 account
3. **Create > Automated cloud flow**
4. **Name:** "Advanced Eye Care Plan - Welcome Email"
5. **Trigger:** "When a HTTP request is received"

### Step 2: Configure HTTP Trigger

**HTTP Request Trigger Settings:**
- **Method:** POST
- **Request Body JSON Schema:**
```json
{
    "type": "object",
    "properties": {
        "customer_email": {
            "type": "string"
        },
        "customer_name": {
            "type": "string"
        },
        "subscription_id": {
            "type": "string"
        },
        "amount": {
            "type": "number"
        },
        "plan_name": {
            "type": "string"
        }
    }
}
```

### Step 3: Add Email Action

1. **Add action > Send an email (V2)**
2. **Connect to Outlook/Office 365**
3. **Configure email:**

**To:** `@{triggerBody()?['customer_email']}`
**Subject:** `Welcome to Advanced Eye Care Plan - Your WhatsApp Details Inside!`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2D5A5A, #4A7373); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
        .whatsapp-box { background: #E8F5E8; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .whatsapp-number { font-size: 24px; font-weight: bold; color: #25D366; margin: 10px 0; }
        .benefits { background: #f8fbfc; border-radius: 8px; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Advanced Eye Care Plan!</h1>
            <p>Your premium eye care journey starts now</p>
        </div>
        
        <div class="content">
            <p>Dear @{triggerBody()?['customer_name']},</p>
            
            <p>Thank you for joining our <strong>Advanced Eye Care Plan</strong>! We're excited to provide you with premium eye care services.</p>
            
            <div class="whatsapp-box">
                <h3>📱 Your WhatsApp Contact Details</h3>
                <p>Save this number to your contacts:</p>
                <div class="whatsapp-number">+44 7737886713</div>
                <p><strong>Contact:</strong> Petru Pavalasc - Advanced Eye Care</p>
                <p><strong>Available:</strong> 8am-8pm, 7 days a week</p>
                <p><a href="https://wa.me/447XXXXXXXXX">💬 Message Us on WhatsApp</a></p>
            </div>
            
            <h3>✅ Your Plan Benefits</h3>
            <div class="benefits">
                <p>💰 <strong>25% Discount</strong> on all services</p>
                <p>📱 <strong>WhatsApp Support</strong> 7 days a week</p>
                <p>🔧 <strong>Free Services</strong> - adjustments & repairs</p>
                <p>⭐ <strong>Priority Booking</strong></p>
                <p>🏠 <strong>Home Visits</strong></p>
            </div>
            
            <h3>🚀 What's Next?</h3>
            <ol>
                <li>Add our WhatsApp number to your contacts</li>
                <li>Send us a message to introduce yourself</li>
                <li>Request your first discounted appointment</li>
            </ol>
            
            <p><strong>Plan Details:</strong></p>
            <ul>
                <li>Plan: @{triggerBody()?['plan_name']}</li>
                <li>Price: £@{div(triggerBody()?['amount'], 100)}/month</li>
                <li>Subscription ID: @{triggerBody()?['subscription_id']}</li>
            </ul>
            
            <p>Welcome to the family!</p>
            
            <p><strong>Petru Pavalasc</strong><br>
            Professional Optometrist<br>
            I Care Services Providers Ltd</p>
        </div>
    </div>
</body>
</html>
```

### Step 4: Get Power Automate Webhook URL

1. **Save the flow**
2. **Copy the HTTP POST URL** from the trigger
3. **It will look like:** `https://prod-xx.westeurope.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?...`

### Step 5: Update Your Server

Replace the email sending code with a simple HTTP call to Power Automate:

```javascript
// Replace the email sending function
async function handleNewSubscription(subscription) {
  try {
    console.log('🎉 Processing new Advanced Eye Care Plan subscription...');
    
    // Get customer details from Stripe
    const customer = await stripeClient.customers.retrieve(subscription.customer);
    
    if (customer.email) {
      console.log(`📧 Triggering Power Automate for: ${customer.email}`);
      
      // Prepare data for Power Automate
      const emailData = {
        customer_email: customer.email,
        customer_name: customer.name || customer.email.split('@')[0] || 'Valued Customer',
        subscription_id: subscription.id,
        amount: subscription.items.data[0].price.unit_amount,
        plan_name: 'Advanced Eye Care Plan'
      };
      
      // Call Power Automate webhook
      const response = await fetch(process.env.POWER_AUTOMATE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        console.log('✅ Power Automate email triggered successfully!');
        console.log(`   📧 To: ${customer.email}`);
      } else {
        console.error('❌ Failed to trigger Power Automate:', response.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Error handling new subscription:', error);
  }
}
```

### Step 6: Update Environment Variables

Add to your `.env` file:
```bash
# Power Automate Webhook URL
POWER_AUTOMATE_WEBHOOK_URL=https://prod-xx.westeurope.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?...
```

## 🧪 Testing Power Automate Flow

### Test the Flow:
1. **In Power Automate > Test > Manually**
2. **Use sample JSON:**
```json
{
    "customer_email": "test@example.com",
    "customer_name": "Test Customer",
    "subscription_id": "sub_test123",
    "amount": 1500,
    "plan_name": "Advanced Eye Care Plan"
}
```

### Test with Real Subscription:
1. Make a test payment on your site
2. Check Power Automate run history
3. Verify email was sent

## 📊 Power Automate Benefits

### Monitoring:
- **Run history** with success/failure status
- **Detailed logs** for troubleshooting
- **Performance metrics**
- **Error notifications**

### Management:
- **Easy to update** email templates
- **Version control** for flows
- **Approval workflows** for changes
- **Team collaboration**

### Security:
- **No credentials** in your code
- **Microsoft security standards**
- **Compliance features**
- **Audit trails**

## 🔄 Alternative: Microsoft Graph API

For even more control, you can use Microsoft Graph API:

```javascript
// Using Microsoft Graph API (even more secure)
const { Client } = require('@azure/msal-node');

async function sendEmailViaGraph(customerEmail, customerName) {
  // Authenticate with Azure AD
  // Send email via Microsoft Graph
  // Full enterprise features
}
```

## 💡 Recommendation

**For your business, I recommend Power Automate because:**

1. **No server maintenance** - Microsoft handles everything
2. **Visual editing** - Easy to update email templates
3. **Enterprise security** - Bank-level security standards
4. **Scalability** - Handles high volumes automatically
5. **Compliance** - Built-in GDPR/compliance features
6. **Cost-effective** - Pay only for usage

---

## 🚀 Quick Start with Power Automate

1. **Set up the Power Automate flow** (15 minutes)
2. **Update your server** to call the webhook (5 minutes)
3. **Test with a real payment** (2 minutes)
4. **Done!** - Secure, scalable email automation

Would you like me to help you set up the Power Automate flow, or would you prefer to continue with the current Node.js approach?
