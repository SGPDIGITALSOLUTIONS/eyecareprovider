export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const triageData = req.body;
    
    // Format the triage data for email
    const emailContent = `
    NEW MEDICAL TRIAGE SUBMISSION
    =============================
    
    Patient Information:
    - Name: ${triageData.patientName}
    - Phone: ${triageData.patientPhone}
    - Email: ${triageData.patientEmail}
    - Timestamp: ${triageData.timestamp}
    
    Symptoms & Assessment:
    - Symptoms: ${triageData.symptoms}
    - Started: ${triageData.symptomStart}
    - Last Eye Test: ${triageData.lastEyeTest}
    - Eye Red: ${triageData.eyeRed}
    - Eye Painful: ${triageData.eyePainful}
    ${triageData.painScale ? `- Pain Level: ${triageData.painScale}/10` : ''}
    - Light Sensitive: ${triageData.lightSensitive}
    - Contact Lens Wearer: ${triageData.contactWearer}
    ${triageData.contactType ? `- Contact Type: ${triageData.contactType}` : ''}
    - Double Vision: ${triageData.doubleVision}
    ${triageData.doubleVisionStart ? `- Double Vision Started: ${triageData.doubleVisionStart}` : ''}
    - Flashes/Floaters: ${triageData.flashesFloaters}
    
    Additional Information:
    ${triageData.additionalInfo || 'None provided'}
    
    Photo Attached: ${triageData.hasPhoto ? 'Yes' : 'No'}
    `;

    // Send email using a service (Resend is popular with Vercel)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'triage@icareservices.co.uk',
        to: ['petru@eyecareserviceprovider.co.uk', 'techadmin@eyecareserviceprovider.co.uk'],
        subject: `URGENT: Medical Triage - ${triageData.patientName}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>')
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Triage submitted successfully' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Failed to process triage submission' 
    });
  }
} 