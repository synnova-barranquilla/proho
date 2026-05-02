import { useSuspenseQuery } from '@tanstack/react-query'

import { convexQuery } from '@convex-dev/react-query'
import { Download, FileText, Image, Video } from 'lucide-react'

import { Card, CardContent } from '#/components/ui/card'
import { cn } from '#/lib/utils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface AttachmentsTabProps {
  complexId: Id<'complexes'>
}

function mimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Video
  return FileText
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentsTab({ complexId }: AttachmentsTabProps) {
  const { data: attachments } = useSuspenseQuery(
    convexQuery(api.communications.queries.listAttachmentsByComplex, {
      complexId,
    }),
  )

  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">Sin adjuntos</p>
        <p className="max-w-sm text-sm text-muted-foreground/80">
          Los archivos compartidos en conversaciones apareceran aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {attachments.map((attachment) => {
        const Icon = mimeIcon(attachment.mimeType)
        const isImage = attachment.mimeType.startsWith('image/')

        return (
          <Card key={attachment._id} size="sm" className="overflow-hidden">
            <CardContent className="p-0">
              {/* Preview area */}
              <div className="relative flex h-32 items-center justify-center bg-muted/50">
                {isImage ? (
                  <img
                    src={attachment.fileUrl}
                    alt={attachment.fileName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Icon className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {attachment.fileName}
                  </p>
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'shrink-0 rounded-md p-1 text-muted-foreground transition-colors',
                      'hover:bg-muted hover:text-foreground',
                    )}
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </p>
                {attachment.uploadedByName && (
                  <p className="text-xs text-muted-foreground">
                    Subido por {attachment.uploadedByName}
                  </p>
                )}
                {attachment.residentName && (
                  <p className="text-xs text-muted-foreground">
                    Residente: {attachment.residentName}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(attachment.createdAt).toLocaleString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
