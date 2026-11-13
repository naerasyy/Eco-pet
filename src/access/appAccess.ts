import type { Access, Where } from 'payload'

export const isAppUser = (user: unknown): user is { id: string | number; collection: 'users' } => {
  if (!user || typeof user !== 'object') return false
  const candidate = user as { id?: string | number; collection?: string }
  return candidate.collection === 'users' && candidate.id !== undefined
}

export const appUserOnly: Access = ({ req }) => isAppUser(req.user)

export const ownDocuments: Access = ({ req }) => {
  if (!isAppUser(req.user)) return false
  return { owner: { equals: req.user.id } }
}

export const ownOrPublicDocuments: Access = ({ req }) => {
  if (!isAppUser(req.user)) return { visibility: { equals: 'public' } } as Where
  return {
    or: [{ owner: { equals: req.user.id } }, { visibility: { equals: 'public' } }],
  } as Where
}
