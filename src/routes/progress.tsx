import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Loader2,
  Target,
  XCircle,
} from 'lucide-react'

import ThemeToggle from '#/components/ThemeToggle'
import {
  currentFocus,
  getMilestoneStats,
  getPhaseStats,
  getTotalStats,
  lastUpdated,
  milestones,
  type TaskStatus,
} from '#/data/progress'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/progress')({ component: ProgressPage })

const statusConfig: Record<
  TaskStatus,
  { icon: typeof CheckCircle2; label: string; color: string; muted?: boolean }
> = {
  done: {
    icon: CheckCircle2,
    label: 'Completada',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  wip: {
    icon: Loader2,
    label: 'En progreso',
    color: 'text-blue-600 dark:text-blue-400',
  },
  pending: {
    icon: Circle,
    label: 'Pendiente',
    color: 'text-muted-foreground/50',
  },
  blocked: {
    icon: XCircle,
    label: 'Bloqueada',
    color: 'text-red-600 dark:text-red-400',
  },
  deferred: {
    icon: Clock,
    label: 'Diferida',
    color: 'text-amber-500 dark:text-amber-400',
    muted: true,
  },
}

function ProgressBar({
  percent,
  size = 'md',
  className,
}: {
  percent: number
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-muted/60',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out',
          percent > 0 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-transparent',
        )}
        style={{ width: `${Math.max(percent, 0)}%` }}
      />
    </div>
  )
}

function StatusIcon({ status }: { status: TaskStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <Icon
      className={cn(
        'shrink-0',
        config.color,
        status === 'wip' && 'animate-spin',
      )}
      size={16}
      strokeWidth={2.5}
    />
  )
}

function PhaseRow({
  phase,
  index,
}: {
  phase: (typeof milestones)[0]['phases'][0]
  index: number
}) {
  const [open, setOpen] = useState(false)
  const stats = getPhaseStats(phase)

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-1"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      >
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="text-sm font-semibold">
            {phase.id}{' '}
            <span className="font-medium text-muted-foreground">
              {phase.name}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <ProgressBar percent={stats.percent} size="sm" className="w-16" />
          <span className="w-14 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {stats.done}/{stats.active}
          </span>
        </span>
      </button>

      {open && (
        <div className="mb-1 ml-5 border-l border-border/60 pl-4">
          {phase.tasks.map((task, i) => {
            const config = statusConfig[task.status]
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-2.5 py-1.5 animate-in fade-in slide-in-from-top-1',
                  config.muted && 'opacity-45',
                )}
                style={{
                  animationDelay: `${i * 30}ms`,
                  animationFillMode: 'both',
                }}
              >
                <StatusIcon status={task.status} />
                <span className="min-w-0 flex-1 text-sm leading-snug">
                  {task.name}
                </span>
              </div>
            )
          })}
          {stats.deferred > 0 && (
            <p className="mt-1 pb-1 text-xs text-muted-foreground/60">
              {stats.deferred} tarea{stats.deferred > 1 ? 's' : ''} diferida
              {stats.deferred > 1 ? 's' : ''} a pre-prod
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ProgressPage() {
  const totals = getTotalStats()

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Synnova
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Progreso del Proyecto — Actualizado {lastUpdated}
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Stats */}
      <section className="mb-10 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Progreso Total
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
            {totals.percent}
            <span className="text-base font-normal text-muted-foreground">
              %
            </span>
          </p>
          <ProgressBar percent={totals.percent} className="mt-2" />
          <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
            {totals.done} de {totals.total} tareas
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            MVP
          </p>
          {totals.mvpPercent === 100 ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle2
                  size={20}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <p className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  100%
                </p>
              </div>
              <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                {totals.mvpDone} de {totals.mvpTotal} tareas activas completadas
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
                {totals.mvpPercent}
                <span className="text-base font-normal text-muted-foreground">
                  %
                </span>
              </p>
              <ProgressBar percent={totals.mvpPercent} className="mt-2" />
              <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                {totals.mvpDone} de {totals.mvpTotal} tareas
              </p>
            </>
          )}
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm">
          {totals.mvpPercent === 100 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estado
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Target
                  size={18}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                <p className="text-sm font-semibold leading-snug">
                  MVP Completo
                </p>
              </div>
              {totals.mvpDeferred > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Clock size={12} />
                  <span>
                    {totals.mvpDeferred} tarea
                    {totals.mvpDeferred > 1 ? 's' : ''} diferida
                    {totals.mvpDeferred > 1 ? 's' : ''} a pre-producción
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enfoque Actual
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Target
                  size={18}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                <p className="text-sm font-semibold leading-snug">
                  {currentFocus.phaseId} — {currentFocus.phaseName}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {currentFocus.done} de {currentFocus.total} tareas completadas
              </p>
            </>
          )}
        </div>
      </section>

      {/* Milestones */}
      <section className="space-y-5">
        {milestones.map((milestone) => {
          const stats = getMilestoneStats(milestone)
          return (
            <div
              key={milestone.id}
              className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
            >
              {/* Milestone header */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/40 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {milestone.id}
                  </span>
                  <h2 className="text-base font-bold">{milestone.name}</h2>
                  {milestone.scope === 'mvp' ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      MVP
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Post-MVP
                    </span>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <ProgressBar
                    percent={stats.percent}
                    size="sm"
                    className="w-20"
                  />
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {stats.done}/{stats.active}
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {stats.percent}%
                  </span>
                </div>
              </div>

              {/* Milestone description */}
              <p className="border-b border-border/20 bg-muted/20 px-5 py-2 text-xs text-muted-foreground">
                {milestone.description}
              </p>

              {/* Phases */}
              <div className="divide-y divide-border/30 px-2 py-1">
                {milestone.phases.map((phase, pi) => (
                  <PhaseRow key={phase.id} phase={phase} index={pi} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* Legend */}
      <section className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {Object.entries(statusConfig).map(([key, config]) => (
          <span key={key} className="flex items-center gap-1.5">
            <StatusIcon status={key as TaskStatus} />
            {config.label}
          </span>
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
        Synnova &copy; 2026
      </footer>
    </div>
  )
}
