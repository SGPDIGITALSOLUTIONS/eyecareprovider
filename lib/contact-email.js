const { Resend } = require('resend');

const INQUIRY_LABELS = {
  'appointment-booking': 'Request an Appointment',
  'service-information': 'Service Information',
  'pricing-costs': 'Pricing & Costs',
  'advanced-care-plan': 'Advanced Eye Care Plan',
  'home-visit-info': 'Home Visit Information',
  'nhs-eligibility': 'NHS Eligibility',
  'product-info': 'Product Information',
  'online-glasses-ordering': 'Online Glasses Ordering',
  'coverage-area': 'Coverage Area Query',
  'general-inquiry': 'General Inquiry',
  other: 'Other',
};

function clean(value) {
  return String(value ?? '').trim();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInquiryType(value) {
  if (!value) return 'Website enquiry';
  return INQUIRY_LABELS[value] || value.replace(/-/g, ' ');
}

function parseRecipients(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function sendContactEmail(body) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error = new Error('RESEND_API_KEY is not configured.');
    error.statusCode = 500;
    throw error;
  }

  const recipients = parseRecipients(process.env.CONTACT_TO);
  if (recipients.length === 0) {
    const error = new Error('CONTACT_TO is not configured.');
    error.statusCode = 500;
    throw error;
  }

  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const name = clean(body.name) || [firstName, lastName].filter(Boolean).join(' ');
  const email = clean(body.email);
  const phone = clean(body.phone);
  const address = clean(body.address);
  const inquiryType = clean(body.inquiryType);
  const subject = clean(body.subject) || formatInquiryType(inquiryType);
  const message = clean(body.message);
  const nhsInterest = body.nhsPrivate === 'nhs' || body.nhsPrivate === true;
  const newsletter = body.newsletter === 'yes' || body.newsletter === true;

  if (!name || !email || !message) {
    const error = new Error('Name, email and message are required.');
    error.statusCode = 400;
    throw error;
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'Website <onboarding@resend.dev>',
    to: recipients,
    replyTo: email,
    subject: `Website enquiry: ${subject}`,
    html: `
      <h2>New website enquiry</h2>

      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
      <p><strong>Address:</strong> ${escapeHtml(address || 'Not provided')}</p>
      <p><strong>Enquiry type:</strong> ${escapeHtml(subject)}</p>
      <p><strong>NHS interest:</strong> ${nhsInterest ? 'Yes' : 'No'}</p>
      <p><strong>Newsletter:</strong> ${newsletter ? 'Yes' : 'No'}</p>

      <hr />

      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
    `,
  });

  return {
    success: true,
    message: 'Email sent.',
  };
}

module.exports = {
  sendContactEmail,
};
