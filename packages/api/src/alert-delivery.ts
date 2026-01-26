import { render } from '@react-email/render'
import { EdgeAlertEmail, LineMovementAlertEmail } from './emails'
import nodemailer from 'nodemailer'

// Initialize nodemailer transporter (use environment variables for production)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface AlertDeliveryPayload {
  userId: string
  userEmail: string
  userName: string
  ruleId: string
  type: 'ev' | 'arbitrage' | 'middle' | 'line_movement'
  delivery: {
    email?: boolean
    slack?: boolean
    webhook?: string
  }
  data: Record<string, unknown>
}

export async function sendEdgeAlert(payload: AlertDeliveryPayload) {
  const { userEmail, userName, type, delivery, data } = payload

  if (delivery.email && userEmail) {
    try {
      const emailHtml = render(
        <EdgeAlertEmail
          userName={userName}
          edgeType={type as 'ev' | 'arbitrage' | 'middle'}
          game={{
            homeTeam: data.homeTeam as string,
            awayTeam: data.awayTeam as string,
            date: data.date as string,
          }}
          edge={{
            ev: data.ev as number | undefined,
            ev_percentage: data.ev_percentage as number | undefined,
            kelly: data.kelly as number | undefined,
            confidence: data.confidence as number | undefined,
            score: data.score as number | undefined,
          }}
          book={data.book as string}
          odds={data.odds as string}
          market={data.market as string}
          dashboardUrl={data.dashboardUrl as string}
        />
      )

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@edgeloop.app',
        to: userEmail,
        subject: `🎯 New ${type.toUpperCase()} Detected: ${data.homeTeam} vs ${data.awayTeam}`,
        html: emailHtml,
      })

      console.log(`Email sent to ${userEmail} for ${type} alert`)
    } catch (error) {
      console.error('Failed to send email alert:', error)
      throw error
    }
  }

  if (delivery.slack) {
    try {
      const slackMessage = formatSlackAlert(payload)
      await sendSlackWebhook(delivery.webhook, slackMessage)
      console.log(`Slack alert sent for ${type}`)
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
      throw error
    }
  }
}

export async function sendLineMovementAlert(payload: AlertDeliveryPayload) {
  const { userEmail, userName, delivery, data } = payload

  if (delivery.email && userEmail) {
    try {
      const emailHtml = render(
        <LineMovementAlertEmail
          userName={userName}
          game={{
            homeTeam: data.homeTeam as string,
            awayTeam: data.awayTeam as string,
            date: data.date as string,
          }}
          market={data.market as string}
          previousLine={data.previousLine as string}
          currentLine={data.currentLine as string}
          movement={data.movement as string}
          movePercentage={data.movePercentage as number}
          dashboardUrl={data.dashboardUrl as string}
        />
      )

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@edgeloop.app',
        to: userEmail,
        subject: `📊 Line Movement: ${data.homeTeam} vs ${data.awayTeam}`,
        html: emailHtml,
      })

      console.log(`Line movement email sent to ${userEmail}`)
    } catch (error) {
      console.error('Failed to send line movement email:', error)
      throw error
    }
  }

  if (delivery.slack) {
    try {
      const slackMessage = formatSlackLineMovement(payload)
      await sendSlackWebhook(delivery.webhook, slackMessage)
      console.log(`Slack line movement alert sent`)
    } catch (error) {
      console.error('Failed to send Slack line movement alert:', error)
      throw error
    }
  }
}

function formatSlackAlert(payload: AlertDeliveryPayload): Record<string, unknown> {
  const { type, data } = payload

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎯 New ${type.toUpperCase()} Alert`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Game:*\n${data.homeTeam} vs ${data.awayTeam}`,
          },
          {
            type: 'mrkdwn',
            text: `*Market:*\n${data.market}`,
          },
          {
            type: 'mrkdwn',
            text: `*Book:*\n${data.book}`,
          },
          {
            type: 'mrkdwn',
            text: `*Odds:*\n${data.odds}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*EV:*\n${(data.ev_percentage as number | undefined)?.toFixed(2) || 'N/A'}%`,
          },
          {
            type: 'mrkdwn',
            text: `*Kelly (25%):*\n${((data.kelly as number | undefined) ?? 0 * 100).toFixed(1)}%`,
          },
          {
            type: 'mrkdwn',
            text: `*Confidence:*\n${(data.confidence as number | undefined)?.toFixed(0) || 'N/A'}%`,
          },
          {
            type: 'mrkdwn',
            text: `*Edge Score:*\n${(data.score as number | undefined)?.toFixed(0) || 'N/A'}/100`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View in Dashboard',
              emoji: true,
            },
            url: data.dashboardUrl as string,
            style: 'primary',
          },
        ],
      },
    ],
  }
}

function formatSlackLineMovement(payload: AlertDeliveryPayload): Record<string, unknown> {
  const { data } = payload

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 Line Movement Alert`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Game:*\n${data.homeTeam} vs ${data.awayTeam}`,
          },
          {
            type: 'mrkdwn',
            text: `*Market:*\n${data.market}`,
          },
          {
            type: 'mrkdwn',
            text: `*Previous:*\n${data.previousLine}`,
          },
          {
            type: 'mrkdwn',
            text: `*Current:*\n${data.currentLine}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Movement:* ${data.movement} (${(data.movePercentage as number)?.toFixed(1) || 'N/A'}%)`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Game',
              emoji: true,
            },
            url: data.dashboardUrl as string,
            style: 'primary',
          },
        ],
      },
    ],
  }
}

async function sendSlackWebhook(webhookUrl: string | undefined, message: Record<string, unknown>) {
  if (!webhookUrl) {
    throw new Error('Slack webhook URL is not configured')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    throw new Error(`Slack webhook returned ${response.status}: ${response.statusText}`)
  }

  return response.json()
}
