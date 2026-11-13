import type { CollectionConfig } from 'payload'
import { appUserOnly, isAppUser, ownDocuments } from '@/access/appAccess'

export const PetMessages: CollectionConfig = {
  slug: 'pet-messages',
  admin: { hidden: true },
  access: {
    create: appUserOnly,
    read: ownDocuments,
    update: () => false,
    delete: ownDocuments,
  },
  hooks: {
    beforeChange: [({ data, req }) => {
      if (!isAppUser(req.user)) throw new Error('Kamu harus masuk.')
      data.owner = req.user.id
      return data
    }],
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true, maxDepth: 0, access: { create: () => false, update: () => false } },
    { name: 'sender', type: 'select', required: true, options: ['user', 'pet'] },
    { name: 'message', type: 'textarea', required: true, maxLength: 500 },
  ],
  timestamps: true,
}
