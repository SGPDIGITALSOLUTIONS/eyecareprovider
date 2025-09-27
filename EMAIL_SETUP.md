# Email Automation Setup Guide

## 📧 Automated Welcome Emails for Advanced Eye Care Plan

This system automatically sends welcome emails with WhatsApp contact details when customers join the Advanced Eye Care Plan.

## 🔧 Setup Instructions

### 1. Gmail App Password Setup

**You need to create a Gmail App Password for secure email sending:**

1. **Enable 2-Factor Authentication** on your Gmail account (required)
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Navigate to **Security > 2-Step Verification > App passwords**
4. Select **Mail** and **Other (custom name)**
5. Enter "Eye Care Plan Emails" as the name
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### 2. Update Your .env File

Add these email settings to your `.env` file:

```bash
# Email Configuration
EMAIL_USER=your_actual_gmail@gmail.com
EMAIL_PASSWORD=your_16_character_app_password

# WhatsApp Contact Details
WHATSAPP_NUMBER=+44 7737886713
WHATSAPP_NAME=Petru Pavalasc - Advanced Eye Care
```

**⚠️ Important:** 
- Use your **Gmail App Password**, not your regular Gmail password
- Replace the WhatsApp number with your actual business WhatsApp number
- Keep the `.env` file secure and never commit it to Git

### 3. Test Email Setup

Run this command to test email sending:

```bash
node -e "
const { sendWelcomeEmail } = require('./email-config');
sendWelcomeEmail('test@example.com', 'Test User')
  .then(result => console.log('Test result:', result))
  .catch(err => console.error('Test error:', err));
"
```

## 📨 Email Template Features

### Welcome Email Includes:
- **WhatsApp contact details** with direct link
- **Plan benefits** summary
- **Next steps** for customers
- **Professional branding** with your company colors
- **Mobile-responsive** design

### Email Content:
- WhatsApp number and contact hours
- Complete list of plan benefits
- Instructions for getting started
- Direct WhatsApp message link
- Billing management link

## 🔄 How It Works

1. **Customer subscribes** via Stripe checkout
2. **Stripe webhook** triggers on `customer.subscription.created`
3. **Server retrieves** customer email from Stripe
4. **Welcome email sent** automatically with WhatsApp details
5. **Logs confirmation** in server console

## 🧪 Testing the Flow

### Test with Real Payment:
1. Make a test payment on your site
2. Check server logs for email confirmation
3. Check the customer's email inbox
4. Verify WhatsApp link works

### Test Webhook Locally:
1. Use ngrok for webhook URL: `https://your-ngrok-url.ngrok.app/webhook`
2. Set this URL in your Stripe webhook settings
3. Make test payments and watch server logs

## 📋 Troubleshooting

### Common Issues:

**Email not sending:**
- Check Gmail App Password is correct
- Verify 2FA is enabled on Gmail
- Check server logs for error details

**Webhook not triggering:**
- Verify ngrok is running and webhook URL is correct
- Check Stripe webhook logs in dashboard
- Ensure webhook events include `customer.subscription.created`

**WhatsApp link not working:**
- Verify phone number format: `+44XXXXXXXXXX` (no spaces in URL)
- Test WhatsApp link manually

## 🎯 Customization

### Update WhatsApp Details:
Edit `email-config.js`:
```javascript
whatsapp: {
  number: '+44 7737886713', // Your actual number
  name: 'Your Name - Advanced Eye Care',
  hours: '8am-8pm, 7 days a week' // Your hours
}
```

### Customize Email Template:
- Edit the HTML/text content in `email-config.js`
- Update company branding and colors
- Add additional information as needed

## 🚀 Production Deployment

### For Production:
1. **Use professional email service** (SendGrid, Mailgun, etc.)
2. **Set up proper domain** for email sending
3. **Configure email authentication** (SPF, DKIM)
4. **Monitor email delivery** rates and bounces

### Alternative Email Providers:
- **SendGrid**: More reliable for production
- **Mailgun**: Good API and deliverability
- **Amazon SES**: Cost-effective for high volume

## 📊 Monitoring

### Server Logs Show:
- ✅ Email sent successfully
- ❌ Email sending errors
- 📧 Customer email addresses
- 📨 Email message IDs

### Check These Regularly:
- Email delivery success rate
- Customer feedback on receiving emails
- WhatsApp contact success rate
- Bounce/spam rates

---

**🎉 Your automated welcome email system is now ready!**

Customers will automatically receive WhatsApp contact details and plan information as soon as they subscribe to the Advanced Eye Care Plan.




