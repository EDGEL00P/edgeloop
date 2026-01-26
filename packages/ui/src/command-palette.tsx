'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'

interface KbdProps {
  children: React.ReactNode
}

function Kbd({ children }: KbdProps) {
  return (
    <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-xs font-mono">
      {children}
    </kbd>
  )
}

interface CommandPaletteProps {
  children?: React.ReactNode
}

export function CommandPalette({ children }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed inset-0 grid place-items-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[var(--color-background)] text-[var(--color-foreground)] p-2 shadow-xl border border-[var(--color-border)]">
            <input
              autoFocus
              placeholder="Search teams, markets, actions…"
              className="w-full bg-transparent outline-none p-3 text-lg"
            />
            <div className="text-xs opacity-70 p-2">
              Press <Kbd>⌘K</Kbd> to open, <Kbd>Esc</Kbd> to close.
            </div>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
