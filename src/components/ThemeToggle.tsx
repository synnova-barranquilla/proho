import { useEffect, useState } from 'react'

import { useSearch } from '@tanstack/react-router'

type ThemeMode = 'light' | 'dark'

function getQueryTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null
  const param = new URLSearchParams(window.location.search).get('theme')
  return param === 'light' || param === 'dark' ? param : null
}

function getInitialMode(): ThemeMode {
  const fromQuery = getQueryTheme()
  if (fromQuery) return fromQuery

  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  }

  return 'light'
}

function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(mode)
  root.setAttribute('data-theme', mode)
  root.style.colorScheme = mode
}

export default function ThemeToggle() {
  const search = useSearch({ from: '__root__' })
  const [mode, setMode] = useState<ThemeMode>('light')

  // Query param takes priority — sync when it changes
  useEffect(() => {
    if (search.theme) {
      setMode(search.theme)
      applyThemeMode(search.theme)
    }
  }, [search.theme])

  // Initial mount (no query param)
  useEffect(() => {
    if (!search.theme) {
      const initial = getInitialMode()
      setMode(initial)
      applyThemeMode(initial)
    }
  }, [])

  function toggleMode() {
    // Don't allow toggling when query param is forcing a theme
    if (search.theme) return

    const next: ThemeMode = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    applyThemeMode(next)
    window.localStorage.setItem('theme', next)
  }

  const label = search.theme
    ? `Theme forced to ${mode} via URL`
    : `Theme: ${mode}. Click to switch.`

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      disabled={!!search.theme}
      className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5 disabled:opacity-50"
    >
      {mode === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
