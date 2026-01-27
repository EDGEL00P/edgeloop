import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from '@/_app-admin/not-found'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('NotFound Page', () => {
  it('renders 404 heading', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404')
  })

  it('renders page not found message', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Page Not Found')
  })

  it('renders home link', () => {
    render(<NotFound />)
    const homeLink = screen.getByRole('link', { name: /go home/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders predictions link', () => {
    render(<NotFound />)
    const predictionsLink = screen.getByRole('link', { name: /view predictions/i })
    expect(predictionsLink).toHaveAttribute('href', '/predictions')
  })
})
