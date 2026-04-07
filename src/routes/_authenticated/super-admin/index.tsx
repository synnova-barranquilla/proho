import { Suspense, useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { ConvexError } from 'convex/values'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { InviteAdminDialog } from '#/components/super-admin/invite-admin-dialog'
import { OrgConfirmDeactivateDialog } from '#/components/super-admin/org-confirm-deactivate-dialog'
import { OrgCreateDialog } from '#/components/super-admin/org-create-dialog'
import { OrgsTable } from '#/components/super-admin/orgs-table'
import { OrgsTableSkeleton } from '#/components/super-admin/skeletons/orgs-table-skeleton'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { api } from '../../../../convex/_generated/api'
import type { Doc } from '../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authenticated/super-admin/')({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(
      convexQuery(api.organizations.queries.listAll, {
        includeInactive: false,
      }),
    )
    return null
  },
  component: OrganizacionesPage,
})

function OrganizacionesPage() {
  const [showInactive, setShowInactive] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOrg, setInviteOrg] = useState<Doc<'organizations'> | null>(null)
  const [deactivateOrg, setDeactivateOrg] =
    useState<Doc<'organizations'> | null>(null)

  const setActiveFn = useConvexMutation(api.organizations.mutations.setActive)
  const reactivateMutation = useMutation({ mutationFn: setActiveFn })

  const handleReactivate = async (org: Doc<'organizations'>) => {
    try {
      await reactivateMutation.mutateAsync({
        orgId: org._id,
        active: true,
      })
      toast.success('Organización reactivada', {
        description: `${org.name} puede recibir logins de nuevo.`,
      })
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message?: string }
        toast.error(data.message ?? 'Error al reactivar')
      } else {
        toast.error('Error inesperado')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Organizaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra los tenants del sistema y sus administradores.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={(checked) => setShowInactive(checked === true)}
            />
            <Label htmlFor="show-inactive" className="text-sm">
              Mostrar inactivas
            </Label>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nueva organización
          </Button>
        </div>
      </div>

      <Suspense fallback={<OrgsTableSkeleton />}>
        <OrgsTable
          showInactive={showInactive}
          onCreate={() => setCreateOpen(true)}
          onInviteAdmin={(org) => setInviteOrg(org)}
          onDeactivate={(org) => setDeactivateOrg(org)}
          onReactivate={handleReactivate}
        />
      </Suspense>

      <OrgCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <InviteAdminDialog
        open={!!inviteOrg}
        onOpenChange={(open) => !open && setInviteOrg(null)}
        initialOrgId={inviteOrg?._id}
      />

      {deactivateOrg && (
        <OrgConfirmDeactivateDialog
          open={true}
          onOpenChange={(open) => !open && setDeactivateOrg(null)}
          org={deactivateOrg}
        />
      )}
    </div>
  )
}
