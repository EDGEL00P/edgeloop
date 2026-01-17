/**
 * Resend Integration - High-Priority Email Alerts
 * Vercel integration automatically provides RESEND_API_KEY
 * Limit: 3k emails/month
 */

import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface AlertEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  priority?: "high" | "normal";
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Send high-priority alert email
 */
export async function sendAlertEmail(params: AlertEmailParams) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL || "alerts@edgeloop.app";

  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      tags: params.tags,
      headers: {
        "X-Priority": params.priority === "high" ? "1" : "3",
      },
    });

    return result;
  } catch (error) {
    console.error("Resend email error:", error);
    throw error;
  }
}

/**
 * Send prediction alert when edge is detected
 */
export async function sendPredictionAlert(
  email: string,
  gameInfo: {
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    confidence: number;
    edge: number;
  }
) {
  const subject = `🎯 Edge Detected: ${gameInfo.homeTeam} vs ${gameInfo.awayTeam}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .prediction { background: #fff; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
          .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
          .metric { text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #10b981; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Edgeloop Prediction Alert</h1>
          </div>
          <div class="content">
            <h2>${gameInfo.homeTeam} vs ${gameInfo.awayTeam}</h2>
            <div class="prediction">
              <strong>Prediction:</strong> ${gameInfo.prediction}
            </div>
            <div class="metrics">
              <div class="metric">
                <div class="metric-value">${(gameInfo.confidence * 100).toFixed(0)}%</div>
                <div>Confidence</div>
              </div>
              <div class="metric">
                <div class="metric-value">${(gameInfo.edge * 100).toFixed(1)}%</div>
                <div>Edge</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated alert from Edgeloop</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendAlertEmail({
    to: email,
    subject,
    html,
    priority: "high",
    tags: [
      { name: "type", value: "prediction_alert" },
      { name: "game", value: `${gameInfo.homeTeam}-${gameInfo.awayTeam}` },
    ],
  });
}

/**
 * Send system alert for errors or issues
 */
export async function sendSystemAlert(
  email: string,
  title: string,
  message: string,
  severity: "error" | "warning" | "info" = "info"
) {
  const subject = `⚠️ Edgeloop System Alert: ${title}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severity === "error" ? "#dc2626" : severity === "warning" ? "#f59e0b" : "#3b82f6"}; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .message { background: #fff; padding: 15px; border-left: 4px solid ${severity === "error" ? "#dc2626" : severity === "warning" ? "#f59e0b" : "#3b82f6"}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>System Alert</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <div class="message">
              ${message}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendAlertEmail({
    to: email,
    subject,
    html,
    priority: severity === "error" ? "high" : "normal",
    tags: [
      { name: "type", value: "system_alert" },
      { name: "severity", value: severity },
    ],
  });
}
