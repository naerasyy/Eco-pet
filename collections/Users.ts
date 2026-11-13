import type { CollectionConfig, Where } from 'payload'
import { appUserOnly, isAppUser } from '@/access/appAccess'

const serverManaged = {
  create: () => false,
  update: () => false,
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    hidden: true,
    useAsTitle: 'displayName',
  },
  access: {
    admin: () => false,
    create: () => true,
    read: ({ req }) => isAppUser(req.user) ? { id: { equals: req.user.id } } as Where : false,
    update: ({ req, id }) => isAppUser(req.user) && String(req.user.id) === String(id),
    delete: ({ req, id }) => isAppUser(req.user) && String(req.user.id) === String(id),
  },
  hooks: {
    afterChange: [
      async ({ doc, req, context }) => {
        if (context.skipProfileSync) return
        const existing = await req.payload.find({
          collection: 'community-profiles',
          where: { owner: { equals: doc.id } },
          limit: 1,
          overrideAccess: true,
          req,
        })
        const data = {
          owner: doc.id,
          displayName: doc.displayName,
          selectedPet: doc.selectedPet,
          level: doc.level || 0,
          points: doc.points || 0,
          currentStreak: doc.currentStreak || 0,
        }
        if (existing.docs[0]) {
          await req.payload.update({ collection: 'community-profiles', id: existing.docs[0].id, data, overrideAccess: true, req, context: { skipProfileSync: true } })
        } else {
          await req.payload.create({ collection: 'community-profiles', data, overrideAccess: true, req, context: { skipProfileSync: true } })
        }
      },
    ],
  },
  fields: [
    { name: 'displayName', type: 'text', required: true, maxLength: 24 },
    {
      name: 'selectedPet',
      type: 'select',
      required: true,
      defaultValue: 'turtle',
      options: ['turtle', 'rabbit', 'cat', 'snake'],
    },
    { name: 'level', type: 'number', defaultValue: 0, access: serverManaged },
    { name: 'xp', type: 'number', defaultValue: 0, access: serverManaged },
    { name: 'points', type: 'number', defaultValue: 0, access: serverManaged },
    { name: 'ecoTokens', type: 'number', defaultValue: 0, access: serverManaged },
    { name: 'currentStreak', type: 'number', defaultValue: 0, access: serverManaged },
    { name: 'longestStreak', type: 'number', defaultValue: 0, access: serverManaged },
    { name: 'lastActiveDate', type: 'date', access: serverManaged },
    {
      name: 'ownedAccessories',
      type: 'select',
      hasMany: true,
      defaultValue: [],
      access: serverManaged,
      options: ['leaf-crown', 'adventure-hat', 'pixel-glasses'],
    },
    {
      name: 'equippedAccessory',
      type: 'select',
      defaultValue: 'none',
      options: ['none', 'leaf-crown', 'adventure-hat', 'pixel-glasses'],
    },
  ],
  timestamps: true,
}
