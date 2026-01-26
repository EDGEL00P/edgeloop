# Edgeloop Design System

## Overview

Edgeloop uses a comprehensive design token system optimized for sports betting analytics. The design system supports 4 theme variants and includes specialized color schemes for sports, betting markets, and confidence indicators.

## Theme Variants

### 1. Light Theme (Default)
- **Use Case**: Daytime usage, general browsing
- **Background**: `#ffffff` (Pure white)
- **Foreground**: `#0f172a` (Slate 900)
- **Card**: `#ffffff` with `#e2e8f0` borders

### 2. Dark Theme
- **Use Case**: Low-light environments, extended usage
- **Background**: `#0b0c10` (Near black)
- **Foreground**: `#e5e7eb` (Gray 200)
- **Card**: `#1a1f2e` (Dark navy) with matching borders

### 3. Contrast Theme
- **Use Case**: Accessibility, high visibility needed
- **Background**: `#000000` (Pure black)
- **Foreground**: `#ffffff` (Pure white)
- **Muted**: `#aaaaaa` (Mid gray)

### 4. Broadcast Theme
- **Use Case**: Live streaming, TV presentation, public displays
- **Background**: `#0a0a0a` (Broadcast black)
- **Foreground**: `#d1d5db` (Gray 300)
- **Accent Colors**: Red (#E63946), Gold (#F1C40F), Navy (#1A1F2E), Steel (#2C3E50)

## Color Tokens

### Brand Colors
```css
--color-brand: #2c6ff7        /* Primary brand blue */
--color-accent: #8b5cf6       /* Purple accent */
--color-success: #18a957      /* Green for wins/success */
--color-warning: #f59e0b      /* Amber for caution */
--color-danger: #ef4444       /* Red for alerts/losses */
```

### Sports-Specific Colors
```css
--color-team-home: #1f2937    /* Dark gray for home team */
--color-team-away: #111827    /* Darker gray for away team */
--color-market-spread: #1d4ed8 /* Blue for point spread bets */
--color-market-total: #f97316  /* Orange for over/under bets */
```

### Confidence Indicators
Use these to indicate prediction quality and edge strength:
```css
--color-confidence-high: #10B981    /* Green: Strong edge (>60%) */
--color-confidence-medium: #F59E0B  /* Amber: Moderate edge (40-60%) */
--color-confidence-low: #EF4444     /* Red: Weak edge (<40%) */
```

### Broadcast Colors
For TV-style presentation and live displays:
```css
--color-broadcast-red: #E63946      /* Primary broadcast accent */
--color-broadcast-gold: #F1C40F     /* Premium/featured highlight */
--color-broadcast-navy: #1A1F2E     /* Background cards */
--color-broadcast-steel: #2C3E50    /* Secondary elements */
--color-broadcast-white: #FFFFFF    /* Text on dark backgrounds */
--color-broadcast-darkRed: #C1121F  /* Hover states */
```

## Usage Guidelines

### Alert System
- **High Confidence Edges**: Use `--color-confidence-high` for alerts with >60% win probability
- **Medium Confidence**: Use `--color-confidence-medium` for 40-60% edges
- **Low Confidence**: Use `--color-confidence-low` for <40% edges
- **Status Indicators**: Green dot for active, amber for paused, red for stopped

### Bet Slip
- **Default Theme**: Light/dark for regular usage
- **Broadcast Mode**: Switch to broadcast theme for clean TV presentation
- **Market Types**: Use `--color-market-spread` for spread bets, `--color-market-total` for totals
- **Team Colors**: Apply `--color-team-home` and `--color-team-away` for matchup clarity

### What-If Analysis Tool
- **Spread Scenarios**: Blue (`--color-market-spread`) for point spread simulations
- **Total Scenarios**: Orange (`--color-market-total`) for over/under simulations
- **Outcome Confidence**: Apply confidence colors to predicted outcomes
- **ROI Indicators**: Green for positive ROI, red for negative

### Backtesting Results
- **Win Rate**: Color-coded bars using confidence colors
- **Profitable Strategies**: Highlight with `--color-success`
- **Losing Strategies**: Mark with `--color-danger`
- **Confidence Bands**: Show prediction reliability with confidence color gradients

### Edge Detection
- **Strong Edges**: Green cards with `--color-confidence-high`
- **Moderate Edges**: Amber cards with `--color-confidence-medium`
- **Weak Edges**: Red cards with `--color-confidence-low`
- **Team Identification**: Use team colors for matchup context

## Component Patterns

### Cards
```tsx
// Default card (adapts to theme)
<div className="bg-[var(--color-card)] border border-[var(--color-border)]">

// Confidence-based card
<div className="bg-[var(--color-confidence-high)] bg-opacity-10 border border-[var(--color-confidence-high)]">

// Broadcast card
<div data-theme="broadcast" className="bg-[var(--color-broadcast-navy)] border border-[var(--color-broadcast-steel)]">
```

### Buttons
```tsx
// Primary action
<button className="bg-[var(--color-brand)] text-white">

// Success state
<button className="bg-[var(--color-success)] text-white">

// Broadcast accent
<button className="bg-[var(--color-broadcast-red)] text-[var(--color-broadcast-white)]">
```

### Badges
```tsx
// Confidence indicator
<span className="bg-[var(--color-confidence-high)] text-white">High Edge</span>

// Market type
<span className="bg-[var(--color-market-spread)] text-white">Spread</span>

// Broadcast label
<span className="bg-[var(--color-broadcast-gold)] text-black">LIVE</span>
```

## Theme Switching

Apply theme via `data-theme` attribute on root:
```tsx
// Default (light)
<html>

// Dark theme
<html data-theme="dark">

// Contrast theme
<html data-theme="contrast">

// Broadcast theme
<html data-theme="broadcast">
```

## Accessibility

- **Contrast Ratios**: All color combinations meet WCAG AA standards (4.5:1 for text)
- **Contrast Theme**: Provides maximum contrast for visually impaired users
- **Color Independence**: Never rely on color alone; always include text labels
- **Focus States**: Use `--color-ring` for keyboard navigation visibility

## File Locations

- **Token Definitions**: `packages/tokens/theme.css`
- **Global Styles**: `apps/web/app/globals.css`
- **UI Components**: `packages/ui/src/`
- **Design System**: This file (`DESIGN_SYSTEM.md`)

## Migration Guide

### From Hardcoded Colors
```tsx
// Before
<div className="bg-[#252B3D] border border-[#2D3548]">

// After
<div className="bg-[var(--color-card)] border border-[var(--color-border)]">
```

### From Tailwind Classes to Tokens
```tsx
// Before
<div className="bg-gray-900 text-gray-200">

// After
<div className="bg-[var(--color-background)] text-[var(--color-foreground)]">
```

## Best Practices

1. **Always use CSS custom properties** instead of hardcoded hex values
2. **Use semantic tokens** (e.g., `--color-card` not `--color-dark-gray`)
3. **Test all 4 themes** before shipping components
4. **Apply confidence colors consistently** across all prediction features
5. **Use broadcast theme sparingly** - only for presentation/TV mode
6. **Respect theme preference** - don't force light/dark mode
7. **Document color choices** when deviating from system tokens

## Future Enhancements

- [ ] Team-specific color schemes (NBA, NFL, MLB franchises)
- [ ] Animated gradient backgrounds for live games
- [ ] Color-blind friendly alternatives
- [ ] Custom theme builder for white-label deployments
