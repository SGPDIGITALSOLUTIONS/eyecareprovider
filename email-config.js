// Email configuration for Advanced Eye Care Plan automation
const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  // Gmail SMTP configuration (you can change to other providers)
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD // Your Gmail app password
    }
  },
  
  // Email settings
  from: {
    name: 'I Care Services Providers Ltd',
    email: process.env.EMAIL_USER || 'info@icareservices.co.uk'
  },
  
  // WhatsApp contact details
  whatsapp: {
    number: '+44 7737886713', // WhatsApp number for customer support
    name: 'Petru Pavalasc - Advanced Eye Care',
    hours: '8am-8pm, 7 days a week'
  }
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter(emailConfig.smtp);
};

// Welcome email template
const createWelcomeEmail = (customerEmail, customerName = 'Valued Customer') => {
  const subject = 'Welcome to Advanced Eye Care Plan - Your WhatsApp Details Inside!';
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Advanced Eye Care Plan</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2D5A5A, #4A7373); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
        .whatsapp-box { background: #E8F5E8; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .whatsapp-number { font-size: 24px; font-weight: bold; color: #25D366; margin: 10px 0; }
        .benefits { background: #f8fbfc; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .benefit-item { display: flex; align-items: center; margin: 10px 0; }
        .benefit-icon { font-size: 20px; margin-right: 15px; }
        .cta-button { display: inline-block; background: #2D5A5A; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Advanced Eye Care Plan!</h1>
            <p>Your premium eye care journey starts now</p>
        </div>
        
        <div class="content">
            <p>Dear ${customerName},</p>
            
            <p>Thank you for joining our <strong>Advanced Eye Care Plan</strong>! We're excited to provide you with premium eye care services with exclusive benefits and professional support.</p>
            
            <div class="whatsapp-box">
                <h3>📱 Your WhatsApp Contact Details</h3>
                <p>Save this number to your contacts for instant support:</p>
                <div class="whatsapp-number">${emailConfig.whatsapp.number}</div>
                <p><strong>Contact Name:</strong> ${emailConfig.whatsapp.name}</p>
                <p><strong>Available:</strong> ${emailConfig.whatsapp.hours}</p>
                <p style="font-size: 14px; color: #666; margin-top: 15px;">
                    💡 <em>Send us a WhatsApp message anytime for eye care advice, appointment booking, or questions about your plan!</em>
                </p>
            </div>
            
            <h3>✅ Your Plan Benefits</h3>
            <div class="benefits">
                <div class="benefit-item">
                    <span class="benefit-icon">💰</span>
                    <span><strong>25% Discount</strong> on all services, frames, and lenses</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">📱</span>
                    <span><strong>WhatsApp Support</strong> - Direct access 7 days a week</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">🔧</span>
                    <span><strong>Free Services</strong> - Adjustments and minor repairs included</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">⭐</span>
                    <span><strong>Priority Booking</strong> - Skip the queue for appointments</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">🏠</span>
                    <span><strong>Home Visits</strong> - Professional care at your convenience</span>
                </div>
            </div>
            
            <h3>🚀 What's Next?</h3>
            <ol>
                <li><strong>Add our WhatsApp</strong> - Save the number above to your contacts</li>
                <li><strong>Send us a message</strong> - Introduce yourself and let us know you've joined!</li>
                <li><strong>Request your first appointment</strong> - Enjoy your 25% discount immediately</li>
            </ol>
            
            <p style="text-align: center;">
                <a href="https://wa.me/${emailConfig.whatsapp.number.replace(/[^0-9]/g, '')}" class="cta-button">
                    💬 Message Us on WhatsApp
                </a>
            </p>
            
            <h3>📋 Plan Details</h3>
            <ul>
                <li><strong>Plan:</strong> Advanced Eye Care Plan</li>
                <li><strong>Price:</strong> £15.00/month</li>
                <li><strong>Commitment:</strong> 12 months minimum</li>
                <li><strong>Next Billing:</strong> Monthly on your signup date</li>
            </ul>
            
            <p>If you have any questions or need immediate assistance, don't hesitate to reach out via WhatsApp or email us at <a href="mailto:info@icareservices.co.uk">info@icareservices.co.uk</a>.</p>
            
            <p>Welcome to the family!</p>
            
            <p><strong>Petru Pavalasc</strong><br>
            Professional Optometrist<br>
            I Care Services Providers Ltd</p>
        </div>
        
        <div class="footer">
            <p>© 2025 I Care Services Providers Ltd. All rights reserved.</p>
            <p>You received this email because you subscribed to our Advanced Eye Care Plan.</p>
            <p><a href="https://billing.stripe.com/p/login/test_cNi5kD8T2fYz3uS5yg67S00">Manage your subscription</a></p>
        </div>
    </div>
</body>
</html>`;

  const textContent = `
Welcome to Advanced Eye Care Plan!

Dear ${customerName},

Thank you for joining our Advanced Eye Care Plan! 

Your WhatsApp Contact Details:
Number: ${emailConfig.whatsapp.number}
Contact: ${emailConfig.whatsapp.name}
Hours: ${emailConfig.whatsapp.hours}

Your Benefits:
• 25% Discount on all services
• WhatsApp Support 7 days a week  
• Free adjustments and repairs
• Priority booking
• Home visit services

Plan Details:
• Plan: Advanced Eye Care Plan
• Price: £15.00/month
• Commitment: 12 months minimum

What's Next:
1. Add our WhatsApp number to your contacts
2. Send us a message to introduce yourself
3. Request your first discounted appointment

Questions? Contact us:
WhatsApp: ${emailConfig.whatsapp.number}
Email: info@icareservices.co.uk

Welcome to the family!

Petru Pavalasc
Professional Optometrist
I Care Services Providers Ltd
`;

  return {
    from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
    to: customerEmail,
    subject: subject,
    text: textContent,
    html: htmlContent
  };
};

// Send welcome email function
const sendWelcomeEmail = async (customerEmail, customerName) => {
  try {
    const transporter = createTransporter();
    const emailOptions = createWelcomeEmail(customerEmail, customerName);
    
    const result = await transporter.sendMail(emailOptions);
    console.log('✅ Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  emailConfig,
  sendWelcomeEmail,
  createTransporter
};




