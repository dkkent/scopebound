interface TimelineEmailData {
  clientName: string;
  clientEmail: string;
  projectName: string;
  timelineUrl: string;
  agencyName?: string;
}

export function generateTimelineEmailHtml(data: TimelineEmailData): string {
  const { clientName, projectName, timelineUrl, agencyName = "Scopebound" } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Timeline Ready</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 40px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .button:hover {
            background: #5568d3;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          h1 {
            margin: 0;
            font-size: 28px;
          }
          .project-name {
            font-weight: 600;
            color: #667eea;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Your Project Timeline is Ready</h1>
        </div>
        
        <div class="content">
          <p>Hi ${clientName},</p>
          
          <p>Great news! We've completed the project timeline for <span class="project-name">${projectName}</span>.</p>
          
          <p>This detailed timeline includes:</p>
          <ul>
            <li>Project phases and deliverables</li>
            <li>Estimated duration and milestones</li>
            <li>Cost breakdown and investment details</li>
            <li>Key assumptions and risk considerations</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="${timelineUrl}" class="button">View Project Timeline</a>
          </p>
          
          <p>Please review the timeline and let us know if you have any questions or would like to discuss any aspect of the project scope.</p>
          
          <p>We're excited to work with you on this project!</p>
          
          <p>Best regards,<br>${agencyName} Team</p>
        </div>
        
        <div class="footer">
          <p>This timeline link is valid and can be accessed at any time.</p>
          <p>If you have questions, feel free to reach out to us.</p>
        </div>
      </body>
    </html>
  `;
}

export function generateTimelineEmailText(data: TimelineEmailData): string {
  const { clientName, projectName, timelineUrl, agencyName = "Scopebound" } = data;

  return `
Hi ${clientName},

Great news! We've completed the project timeline for ${projectName}.

This detailed timeline includes:
- Project phases and deliverables
- Estimated duration and milestones
- Cost breakdown and investment details
- Key assumptions and risk considerations

View your project timeline here: ${timelineUrl}

Please review the timeline and let us know if you have any questions or would like to discuss any aspect of the project scope.

We're excited to work with you on this project!

Best regards,
${agencyName} Team

---
This timeline link is valid and can be accessed at any time.
If you have questions, feel free to reach out to us.
  `.trim();
}
