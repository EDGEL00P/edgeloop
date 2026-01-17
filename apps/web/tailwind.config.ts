import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      // ESPN-grade NFL design tokens
      spacing: {
        'broadcast': '1rem', // Standard broadcast spacing
        'studio': '2rem', // Studio panel spacing
        'field': '0.5rem', // Field line spacing
      },
      // Edge states for predictions
      boxShadow: {
        'edge-high': '0 0 20px rgba(34, 197, 94, 0.3)',
        'edge-medium': '0 0 12px rgba(34, 197, 94, 0.2)',
        'edge-low': '0 0 8px rgba(34, 197, 94, 0.1)',
        // Risk states
        'risk-high': '0 0 20px rgba(239, 68, 68, 0.3)',
        'risk-medium': '0 0 12px rgba(239, 68, 68, 0.2)',
      },
      // 3D perspective utilities
      perspective: {
        '1000': '1000px',
        '800': '800px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
    },
  },
  plugins: [],
};

export default config;
