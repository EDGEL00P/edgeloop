'use client'

import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun, Tv } from 'lucide-react'

type Theme = 'light' | 'dark' | 'contrast' | 'broadcast'

interface ThemeSwitcherProps {
  className?: string
  variant?: 'buttons' | 'dropdown'
}

export function ThemeSwitcher({ className, variant = 'buttons' }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('edgeloop-theme') as Theme | null
    if (stored) {
      setTheme(stored)
      applyTheme(stored)
    } else {
      // Default to dark theme
      applyTheme('dark')
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === 'light') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', newTheme)
    }
    
    localStorage.setItem('edgeloop-theme', newTheme)
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'contrast', label: 'Contrast', icon: <Monitor className="h-4 w-4" /> },
    { value: 'broadcast', label: 'Broadcast', icon: <Tv className="h-4 w-4" /> },
  ]

  if (variant === 'dropdown') {
    return (
      <select
        value={theme}
        onChange={(e) => handleThemeChange(e.target.value as Theme)}
        className={`rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] ${className ?? ''}`}
        aria-label="Select theme"
      >
        {themes.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className={`inline-flex gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 ${className ?? ''}`} role="group" aria-label="Theme switcher">
      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => handleThemeChange(value)}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            theme === value
              ? 'bg-[var(--color-brand)] text-white'
              : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
          }`}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === value}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('edgeloop-theme') as Theme | null
    if (stored) {
      setTheme(stored)
    }

    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('edgeloop-theme') as Theme | null
      if (newTheme) {
        setTheme(newTheme)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return theme
}
