import type { Config } from 'tailwindcss'

const preset: Config = {
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        bg: 'var(--color-bg)',
        fg: 'var(--color-fg)',
        muted: 'var(--color-muted)',
        'team-home': 'var(--color-team-home)',
        'team-away': 'var(--color-team-away)',
        'market-spread': 'var(--color-market-spread)',
        'market-total': 'var(--color-market-total)',
        'broadcast-red': 'var(--color-broadcast-red)',
        'broadcast-gold': 'var(--color-broadcast-gold)',
        'broadcast-navy': 'var(--color-broadcast-navy)',
        'broadcast-steel': 'var(--color-broadcast-steel)',
        'broadcast-white': 'var(--color-broadcast-white)',
        'broadcast-darkRed': 'var(--color-broadcast-darkRed)',
        'confidence-high': 'var(--color-confidence-high)',
        'confidence-medium': 'var(--color-confidence-medium)',
        'confidence-low': 'var(--color-confidence-low)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
}

export default preset
