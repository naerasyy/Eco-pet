import type { CollectionConfig, Where } from 'payload'
import { appUserOnly, isAppUser } from '@/access/appAccess'

export const Friendships: CollectionConfig = {
  slug: 'friendships',
  admin: { hidden: true },
  access: {
    create: appUserOnly,
    read: ({ req }) => isAppUser(req.user) ? { or: [{ requester: { equals: req.user.id } }, { recipient: { equals: req.user.id } }] } as Where : false,
    update: ({ req }) => isAppUser(req.user) ? { recipient: { equals: req.user.id } } : false,
    delete: ({ req }) => isAppUser(req.user) ? { or: [{ requester: { equals: req.user.id } }, { recipient: { equals: req.user.id } }] } as Where : false,
  },
  hooks: {
    beforeChange: [({ data, req, operation }) => {
      if (!isAppUser(req.user)) throw new Error('Kamu harus masuk.')
      if (operation === 'create') {
        data.requester = req.user.id
        data.status = 'pending'
        if (String(data.recipient) === String(req.user.id)) throw new Error('Kamu tidak dapat menambahkan diri sendiri.')
      }
      return data
    }],
  },
  fields: [
    { name: 'requester', type: 'relationship', relationTo: 'users', required: true, maxDepth: 1, index: true, access: { create: () => false, update: () => false } },
    { name: 'recipient', type: 'relationship', relationTo: 'users', required: true, maxDepth: 1, index: true, access: { update: () => false } },
    { name: 'status', type: 'select', required: true, defaultValue: 'pending', options: ['pending', 'accepted', 'declined'] },
  ],
  timestamps: true,
}
