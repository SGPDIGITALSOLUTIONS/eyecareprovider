export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const triageData = req.body;
    
    // Log the triage data for debugging
    console.log('=== NEW MEDICAL TRIAGE SUBMISSION ===');
    console.log('Patient:', triageData.patientName);
    console.log('Phone:', triageData.patientPhone);
    console.log('Email:', triageData.patientEmail);
    console.log('Symptoms:', triageData.symptoms);
    console.log('Pain Level:', triageData.painScale);
    console.log('Timestamp:', triageData.timestamp);
    console.log('========================================');
    
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

    // Try to send email only if API key is available
    if (process.env.RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'triage@icareservices.co.uk', // Custom verified domain
            to: ['petru@eyecareserviceprovider.co.uk', 'techadmin@eyecareserviceprovider.co.uk'],
            subject: `URGENT: Medical Triage - ${triageData.patientName}`,
            text: emailContent,
            html: emailContent.replace(/\n/g, '<br>')
          }),
        });

        if (emailResponse.ok) {
          console.log('Email sent successfully');
        } else {
          console.log('Email failed, but continuing...');
        }
      } catch (emailError) {
        console.log('Email sending failed:', emailError.message);
      }
    } else {
      console.log('No RESEND_API_KEY found, skipping email');
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