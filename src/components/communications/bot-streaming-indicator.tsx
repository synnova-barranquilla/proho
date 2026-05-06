export function BotStreamingIndicator({
  label = 'Asistente Synnova escribiendo...',
}: {
  label?: string
}) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      <div className="flex gap-1">
        <span
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
