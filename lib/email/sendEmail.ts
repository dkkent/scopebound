interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.to)) {
    console.error("Invalid email address:", options.to);
    return false;
  }

  console.log("================ EMAIL NOTIFICATION ================");
  console.log("To:", options.to);
  console.log("Subject:", options.subject);
  console.log("===================================================");

  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, email simulation only");
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return false;
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
