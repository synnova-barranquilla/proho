import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(mode)
  root.setAttribute('data-theme', mode)
  root.style.colorScheme = mode
}

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)

  useEffect(() => {
    applyThemeMode(mode)
  }, [mode])

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    window.localStorage.setItem('theme', next)
  }, [mode])

  return { mode, toggle }
}
