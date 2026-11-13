import type { CollectionConfig } from 'payload'
import { appUserOnly, isAppUser } from '@/access/appAccess'

export const DiaryMedia: CollectionConfig = {
  slug: 'diary-media',
  admin: { hidden: true },
  access: {
    create: appUserOnly,
    read: () => true,
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
    { name: 'alt', type: 'text', required: true, maxLength: 160 },
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, maxDepth: 0, index: true, access: { create: () => false, update: () => false } },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
      return headers
    },
  },
}
