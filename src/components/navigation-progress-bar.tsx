import { useEffect, useState } from 'react'

import { useRouterState } from '@tanstack/react-router'

import { cn } from '#/lib/utils'

/**
 * Thin top-of-viewport progress bar that animates during TanStack Router
 * navigations. Shows only when a navigation takes longer than
 * `DELAY_MS` (so instant navigations don't flicker), and stays visible
 * until the router finishes loading.
 *
 * Inspired by NProgress / `next/router` default top bar. Self-contained
 * (no external library). Rendered once from __root.tsx.
 */
const DELAY_MS = 150

export function NavigationProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setVisible(false)
      return
    }
    // Delay showing so instant navigations don't cause a flicker.
    const t = window.setTimeout(() => setVisible(true), DELAY_MS)
    return () => window.clearTimeout(t)
  }, [isLoading])

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn(
          'h-full w-full origin-left bg-primary',
          // The bar animates from 0 to ~80% width while loading, then
          // the router flips `isLoading` to false and we fade out
          // (opacity-0 above) — the final "100%" flash is implicit.
          visible ? 'animate-[nav-progress_1.5s_ease-out_forwards]' : '',
        )}
      />
    </div>
  )
}
