import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { formatAbsolute, formatRelative } from '#/lib/date'
import { isInternalOrgSlug } from '#/lib/organizations'
import { getFullName } from '#/lib/user'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { InviteAdminDialog } from './invite-admin-dialog'

type EnrichedInvitation = Doc<'invitations'> & {
  invitedByUser: Doc<'users'> | null
}

interface OrgDetailAdminsCardProps {
  org: Doc<'organizations'>
  admins: Array<Doc<'users'>>
  pendingInvitations: Array<EnrichedInvitation>
}

export function OrgDetailAdminsCard({
  org,
  admins,
  pendingInvitations,
}: OrgDetailAdminsCardProps) {
  const isInternal = isInternalOrgSlug(org.slug)
  const [revokingId, setRevokingId] = useState<Id<'invitations'> | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const revokeFn = useConvexMutation(api.invitations.mutations.revoke)
  const revokeMutation = useMutation({ mutationFn: revokeFn })

  const handleRevoke = async (invitationId: Id<'invitations'>) => {
    setRevokingId(invitationId)
    try {
      await toast.promise(revokeMutation.mutateAsync({ invitationId }), {
        loading: 'Revocando invitación...',
        success: 'Invitación revocada',
        error: (err) => {
          if (err instanceof ConvexError) {
            const data = err.data as { message?: string }
            return data.message ?? 'Error al revocar'
          }
          return 'Error inesperado'
        },
      })
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administradores</CardTitle>
        <CardDescription>
          Usuarios con rol ADMIN en esta organización.
        </CardDescription>
        {!isInternal && (
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="size-3.5" />
              Invitar admin
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Activos ({admins.length})
          </h3>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay administradores activos en esta organización.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Email
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell className="font-medium">
                        {getFullName(admin)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {admin.email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Invitaciones pendientes ({pendingInvitations.length})
          </h3>
          {pendingInvitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay invitaciones pendientes.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Invitado
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Expira
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell className="font-medium">
                        {getFullName(inv)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {inv.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Tooltip>
                          <TooltipTrigger className="text-xs text-muted-foreground">
                            {formatRelative(inv.invitedAt)}
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatAbsolute(inv.invitedAt)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              {formatRelative(inv.expiresAt)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatAbsolute(inv.expiresAt)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={revokingId === inv._id}
                          onClick={() => handleRevoke(inv._id)}
                        >
                          <X className="size-4" />
                          <span className="sr-only">Revocar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </CardContent>

      <InviteAdminDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        initialOrgId={org._id}
      />
    </Card>
  )
}
