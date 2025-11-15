interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Validate email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.to)) {
    console.error("Invalid email address:", options.to);
    return false;
  }

  // TODO: Integrate with Resend or other email service
  
  if (process.env.NODE_ENV === "development") {
    console.log("================ EMAIL NOTIFICATION ================");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("Note: Email content hidden in logs for privacy");
    console.log("===================================================");
    
    // In development, we return true to simulate successful sending
    return true;
  }

  // In production, you would integrate with an email service here
  // Example with Resend:
  /*
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "noreply@yourdomain.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
  */

  console.warn("Email sending not configured for production");
  return false;
}
