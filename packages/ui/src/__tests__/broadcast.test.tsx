import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ScoreBug,
  LiveIndicator,
  StatusIndicator,
  TeamLogo,
  OddsDisplay,
  QuarterIndicator,
  GameClock,
} from '../broadcast'

const mockHomeTeam = {
  id: 'team-1',
  name: 'Kansas City Chiefs',
  abbreviation: 'KC',
  primaryColor: '#E31837',
  secondaryColor: '#FFB81C',
}

const mockAwayTeam = {
  id: 'team-2',
  name: 'Buffalo Bills',
  abbreviation: 'BUF',
  primaryColor: '#00338D',
  secondaryColor: '#C60C30',
}

describe('ScoreBug', () => {
  it('renders team scores', () => {
    render(
      <ScoreBug
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        homeScore={21}
        awayScore={17}
        quarter={3}
        timeRemaining={420}
        status="live"
      />
    )
    expect(screen.getByText('21')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
  })

  it('shows LIVE status', () => {
    render(
      <ScoreBug
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        homeScore={0}
        awayScore={0}
        quarter={1}
        timeRemaining={900}
        status="live"
      />
    )
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('shows FINAL status', () => {
    render(
      <ScoreBug
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        homeScore={24}
        awayScore={21}
        quarter={4}
        timeRemaining={0}
        status="final"
      />
    )
    expect(screen.getByText('FINAL')).toBeInTheDocument()
  })

  it('displays team abbreviations', () => {
    render(
      <ScoreBug
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        homeScore={0}
        awayScore={0}
        quarter={1}
        timeRemaining={900}
        status="live"
      />
    )
    expect(screen.getAllByText('KC')).toHaveLength(2) // Logo + label
    expect(screen.getAllByText('BUF')).toHaveLength(2)
  })
})

describe('LiveIndicator', () => {
  it('renders when isLive is true', () => {
    render(<LiveIndicator isLive />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('does not render when isLive is false', () => {
    const { container } = render(<LiveIndicator isLive={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows custom label', () => {
    render(<LiveIndicator isLive label="EN VIVO" />)
    expect(screen.getByText('EN VIVO')).toBeInTheDocument()
  })
})

describe('StatusIndicator', () => {
  it('renders live status', () => {
    render(<StatusIndicator status="live" />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('renders upcoming status with time', () => {
    render(<StatusIndicator status="upcoming" showTime="8:30 PM" />)
    expect(screen.getByText('8:30 PM')).toBeInTheDocument()
  })

  it('renders final status', () => {
    render(<StatusIndicator status="final" />)
    expect(screen.getByText('FINAL')).toBeInTheDocument()
  })

  it('renders delayed status', () => {
    render(<StatusIndicator status="delayed" />)
    expect(screen.getByText('DELAYED')).toBeInTheDocument()
  })
})

describe('TeamLogo', () => {
  it('renders abbreviation when no logo', () => {
    render(
      <TeamLogo
        name="Chiefs"
        abbreviation="KC"
        primaryColor="#E31837"
      />
    )
    expect(screen.getByText('KC')).toBeInTheDocument()
  })

  it('shows team name when showName is true', () => {
    render(
      <TeamLogo
        name="Chiefs"
        abbreviation="KC"
        primaryColor="#E31837"
        showName
      />
    )
    expect(screen.getByText('Chiefs')).toBeInTheDocument()
  })
})

describe('OddsDisplay', () => {
  it('formats positive American odds', () => {
    render(<OddsDisplay odds={150} />)
    expect(screen.getByText('+150')).toBeInTheDocument()
  })

  it('formats negative American odds', () => {
    render(<OddsDisplay odds={-200} />)
    expect(screen.getByText('-200')).toBeInTheDocument()
  })

  it('formats decimal odds', () => {
    render(<OddsDisplay odds={150} format="decimal" />)
    expect(screen.getByText('2.50')).toBeInTheDocument()
  })
})

describe('QuarterIndicator', () => {
  it('renders correct number of quarters', () => {
    const { container } = render(<QuarterIndicator quarter={2} />)
    // Select only the quarter indicator dots (direct children of the flex container)
    const indicators = container.querySelectorAll('.flex > div')
    expect(indicators).toHaveLength(4)
  })

  it('highlights completed quarters', () => {
    const { container } = render(<QuarterIndicator quarter={3} />)
    const indicators = container.querySelectorAll('.flex > div')
    const activeIndicators = Array.from(indicators).filter((el) =>
      el.classList.contains('bg-broadcast-red')
    )
    expect(activeIndicators).toHaveLength(3)
  })
})

describe('GameClock', () => {
  it('displays formatted time', () => {
    render(<GameClock minutes={5} seconds={30} quarter={2} />)
    expect(screen.getByText('5:30')).toBeInTheDocument()
  })

  it('shows quarter when showQuarter is true', () => {
    render(<GameClock minutes={5} seconds={30} quarter={2} showQuarter />)
    expect(screen.getByText('Q2')).toBeInTheDocument()
  })

  it('pads seconds with zero', () => {
    render(<GameClock minutes={1} seconds={5} quarter={1} />)
    expect(screen.getByText('1:05')).toBeInTheDocument()
  })
})
