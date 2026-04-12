import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { z } from 'zod'

import { NavigationProgressBar } from '../components/navigation-progress-bar'
import { Toaster } from '../components/ui/sonner'
import { TooltipProvider } from '../components/ui/tooltip'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
}

const rootSearchSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
})

const THEME_INIT_SCRIPT = `(function(){try{var params=new URLSearchParams(window.location.search);var qTheme=params.get('theme');var stored=window.localStorage.getItem('theme');var mode=(qTheme==='light'||qTheme==='dark')?qTheme:(stored==='light'||stored==='dark')?stored:'light';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(mode);root.setAttribute('data-theme',mode);root.style.colorScheme=mode;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  validateSearch: rootSearchSchema,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Synnova',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Página no encontrada</p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Volver al inicio
      </Link>
    </div>
  )
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <TooltipProvider>
      <NavigationProgressBar />
      <Outlet />
      <Toaster position="top-right" richColors />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
          formDevtoolsPlugin(),
        ]}
      />
    </TooltipProvider>
  )
}
