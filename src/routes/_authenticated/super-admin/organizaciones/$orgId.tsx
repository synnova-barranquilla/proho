import { Suspense } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'

import { convexQuery } from '@convex-dev/react-query'
import { ChevronLeft } from 'lucide-react'

import { ErrorPage } from '#/components/error-page'
import { OrgDetailAdminsCard } from '#/components/super-admin/org-detail-admins-card'
import { OrgDetailInfoCard } from '#/components/super-admin/org-detail-info-card'
import { OrgDetailModulesCard } from '#/components/super-admin/org-detail-modules-card'
import { OrgDetailSkeleton } from '#/components/super-admin/skeletons/org-detail-skeleton'
import { Badge } from '#/components/ui/badge'
import { isInternalOrgSlug } from '#/lib/organizations'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

export const Route = createFileRoute(
  '/_authenticated/super-admin/organizaciones/$orgId',
)({
  loader: async ({ context: { queryClient }, params }) => {
    const orgId = params.orgId as Id<'organizations'>
    const data = await queryClient.ensureQueryData(
      convexQuery(api.organizations.queries.getWithDetails, { orgId }),
    )
    if (!data) {
      throw notFound()
    }
    return { orgId }
  },
  component: OrgDetailPage,
  notFoundComponent: OrgNotFoundPage,
})

function OrgDetailPage() {
  const { orgId } = Route.useLoaderData()

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/super-admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Volver a organizaciones
        </Link>
      </div>

      <Suspense fallback={<OrgDetailSkeleton />}>
        <OrgDetailContent orgId={orgId} />
      </Suspense>
    </div>
  )
}

function OrgDetailContent({ orgId }: { orgId: Id<'organizations'> }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.organizations.queries.getWithDetails, { orgId }),
  )

  if (!data) {
    // Shouldn't happen — the loader already threw notFound(), but this
    // satisfies the type narrowing.
    return null
  }

  const { organization, admins, pendingInvitations } = data
  const isInternal = isInternalOrgSlug(organization.slug)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {organization.name}
          </h1>
          {isInternal && <Badge variant="secondary">Interno</Badge>}
          {!organization.active && <Badge variant="secondary">Inactiva</Badge>}
        </div>
      </div>

      <OrgDetailInfoCard org={organization} />
      <OrgDetailModulesCard org={organization} />
      <OrgDetailAdminsCard
        org={organization}
        admins={admins}
        pendingInvitations={pendingInvitations}
      />
    </div>
  )
}

function OrgNotFoundPage() {
  return (
    <ErrorPage
      title="Organización no encontrada"
      message="La organización que buscas no existe o fue eliminada del sistema."
      primaryAction={{ label: 'Volver a organizaciones', to: '/super-admin' }}
      showLogout={false}
    />
  )
}
