import React from 'react'
import { Html, Body, Head, Hr, Container, Preview, Heading, Text, Link, Section, Button } from '@react-email/components'

interface EdgeAlertEmailProps {
  userName: string
  edgeType: 'ev' | 'arbitrage' | 'middle'
  game: {
    homeTeam: string
    awayTeam: string
    date: string
  }
  edge: {
    ev?: number
    ev_percentage?: number
    kelly?: number
    confidence?: number
    score?: number
  }
  book: string
  odds: string
  market: string
  dashboardUrl: string
}

export const EdgeAlertEmail = ({
  userName,
  edgeType,
  game,
  edge,
  book,
  odds,
  market,
  dashboardUrl,
}: EdgeAlertEmailProps) => {
  const edgeLabel = {
    ev: 'Expected Value',
    arbitrage: 'Arbitrage',
    middle: 'Middle',
  }[edgeType]

  const baseUrl = dashboardUrl.split('/edges')[0] || 'https://edgeloop.app'

  return (
    <Html>
      <Head />
      <Preview>New {edgeLabel} detected: {game.homeTeam} vs {game.awayTeam}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={h1}>🎯 New {edgeLabel} Detected</Heading>

            <Section style={gameSection}>
              <Text style={gameTitle}>
                {game.homeTeam} vs {game.awayTeam}
              </Text>
              <Text style={gameDate}>{new Date(game.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}</Text>
            </Section>

            <Hr style={hr} />

            <Section style={detailsSection}>
              <Text style={label}>Market:</Text>
              <Text style={value}>{market}</Text>

              <Text style={label}>Book:</Text>
              <Text style={value}>{book}</Text>

              <Text style={label}>Odds:</Text>
              <Text style={value}>{odds}</Text>

              {edge.ev_percentage && (
                <>
                  <Text style={label}>Expected Value (EV):</Text>
                  <Text style={{ ...value, color: edge.ev_percentage > 0 ? '#10b981' : '#ef4444' }}>
                    {edge.ev_percentage.toFixed(2)}%
                  </Text>
                </>
              )}

              {edge.kelly && (
                <>
                  <Text style={label}>Kelly Criterion (25%):</Text>
                  <Text style={value}>{(edge.kelly * 100).toFixed(1)}% of bankroll</Text>
                </>
              )}

              {edge.score !== undefined && (
                <>
                  <Text style={label}>Edge Quality Score:</Text>
                  <Text style={value}>{edge.score}/100</Text>
                </>
              )}
            </Section>

            <Hr style={hr} />

            <Section style={cta}>
              <Button style={button} href={dashboardUrl}>
                View in Dashboard
              </Button>
            </Section>

            <Hr style={hr} />

            <Section style={footer}>
              <Text style={footerText}>
                You're receiving this email because you have an alert rule set for {edgeLabel} opportunities.
              </Text>
              <Text style={footerText}>
                <Link href={`${baseUrl}/settings/alerts`} style={link}>
                  Manage your alerts
                </Link>
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

interface LineMovementAlertEmailProps {
  userName: string
  game: {
    homeTeam: string
    awayTeam: string
    date: string
  }
  market: string
  previousLine: string
  currentLine: string
  movement: string
  movePercentage: number
  dashboardUrl: string
}

export const LineMovementAlertEmail = ({
  userName,
  game,
  market,
  previousLine,
  currentLine,
  movement,
  movePercentage,
  dashboardUrl,
}: LineMovementAlertEmailProps) => {
  const baseUrl = dashboardUrl.split('/games')[0] || 'https://edgeloop.app'

  return (
    <Html>
      <Head />
      <Preview>Line moved: {game.homeTeam} vs {game.awayTeam}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={h1}>📊 Line Movement Alert</Heading>

            <Section style={gameSection}>
              <Text style={gameTitle}>
                {game.homeTeam} vs {game.awayTeam}
              </Text>
              <Text style={gameDate}>{new Date(game.date).toLocaleDateString()}</Text>
            </Section>

            <Hr style={hr} />

            <Section style={detailsSection}>
              <Text style={label}>Market:</Text>
              <Text style={value}>{market}</Text>

              <Text style={label}>Previous Line:</Text>
              <Text style={value}>{previousLine}</Text>

              <Text style={label}>Current Line:</Text>
              <Text style={value}>{currentLine}</Text>

              <Text style={label}>Movement:</Text>
              <Text style={{ ...value, color: '#3b82f6' }}>
                {movement} ({movePercentage.toFixed(1)}%)
              </Text>
            </Section>

            <Hr style={hr} />

            <Section style={cta}>
              <Button style={button} href={dashboardUrl}>
                View Game
              </Button>
            </Section>

            <Hr style={hr} />

            <Section style={footer}>
              <Text style={footerText}>
                <Link href={`${baseUrl}/settings/alerts`} style={link}>
                  Manage alerts
                </Link>
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const box = {
  padding: '0 48px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '32px 0 24px',
}

const gameSection = {
  backgroundColor: '#f3f4f6',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const gameTitle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0',
}

const gameDate = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '8px 0 0',
}

const detailsSection = {
  marginBottom: '24px',
}

const label = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  margin: '16px 0 4px',
}

const value = {
  fontSize: '16px',
  color: '#1f2937',
  margin: '0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const cta = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 32px',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '8px 0',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}
