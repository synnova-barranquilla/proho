/**
 * Shape of the name parts shared by users and invitations.
 * `lastName` is optional because some users have only a first name.
 */
interface UserNameParts {
  firstName: string
  lastName?: string
}

/**
 * Returns the display name for a user or invitation.
 * - `{ firstName: "David", lastName: "G" }` → `"David G"`
 * - `{ firstName: "Juan" }` → `"Juan"`
 */
export function getFullName(user: UserNameParts): string {
  if (!user.lastName) return user.firstName
  return `${user.firstName} ${user.lastName}`
}

/**
 * Returns initials for avatar fallbacks.
 * - `{ firstName: "David", lastName: "G" }` → `"DG"`
 * - `{ firstName: "Juan" }` → `"J"`
 * - `{ firstName: "" }` → `"?"`
 */
export function getInitials(user: UserNameParts): string {
  const first = user.firstName.at(0) ?? ''
  const last = user.lastName?.at(0) ?? ''
  const initials = (first + last).toUpperCase()
  return initials.length > 0 ? initials : '?'
}
