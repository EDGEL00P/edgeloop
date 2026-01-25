import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfidenceGauge } from '../charts'

// Note: Recharts components require additional mocking for full testing
// These tests focus on the ConfidenceGauge component which doesn't use Recharts

describe('ConfidenceGauge', () => {
  it('renders with high confidence', () => {
    render(<ConfidenceGauge confidence={0.85} />)
    expect(screen.getByText('85%')).toBeInTheDocument()
  })

  it('renders with medium confidence', () => {
    render(<ConfidenceGauge confidence={0.6} />)
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('renders with low confidence', () => {
    render(<ConfidenceGauge confidence={0.3} />)
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('shows label when showLabel is true', () => {
    render(<ConfidenceGauge confidence={0.75} label="Model Confidence" />)
    expect(screen.getByText('Model Confidence')).toBeInTheDocument()
  })

  it('applies correct size class', () => {
    const { container } = render(<ConfidenceGauge confidence={0.5} size="lg" />)
    const progressBar = container.querySelector('.h-3')
    expect(progressBar).toBeInTheDocument()
  })

  it('uses high confidence color for 75%+', () => {
    const { container } = render(<ConfidenceGauge confidence={0.8} />)
    const valueText = screen.getByText('80%')
    expect(valueText).toHaveClass('text-confidence-high')
  })

  it('uses medium confidence color for 50-74%', () => {
    const { container } = render(<ConfidenceGauge confidence={0.6} />)
    const valueText = screen.getByText('60%')
    expect(valueText).toHaveClass('text-confidence-medium')
  })

  it('uses low confidence color for <50%', () => {
    const { container } = render(<ConfidenceGauge confidence={0.3} />)
    const valueText = screen.getByText('30%')
    expect(valueText).toHaveClass('text-confidence-low')
  })
})
