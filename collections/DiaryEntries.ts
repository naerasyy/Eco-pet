import type { CollectionConfig } from 'payload'
import { appUserOnly, isAppUser, ownOrPublicDocuments } from '@/access/appAccess'

export const DiaryEntries: CollectionConfig = {
  slug: 'diary-entries',
  admin: { useAsTitle: 'title' },
  access: {
    create: appUserOnly,
    read: ownOrPublicDocuments,
    update: ({ req }) => isAppUser(req.user) ? { owner: { equals: req.user.id } } : false,
    delete: ({ req }) => isAppUser(req.user) ? { owner: { equals: req.user.id } } : false,
  },
  hooks: {
    beforeChange: [({ data, req, operation }) => {
      if (!isAppUser(req.user)) throw new Error('Kamu harus masuk.')
      if (operation === 'create') data.owner = req.user.id
      return data
    }],
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0, index: true, access: { create: () => false, update: () => false } },
    { name: 'title', type: 'text', required: true, maxLength: 100 },
    { name: 'story', type: 'textarea', required: true, maxLength: 1000 },
    { name: 'photo', type: 'upload', relationTo: 'diary-media' },
    { name: 'visibility', type: 'select', required: true, defaultValue: 'private', options: ['private', 'public'] },
  ],
  timestamps: true,
}
