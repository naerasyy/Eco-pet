import type { CollectionConfig } from 'payload'

export const CommunityProfiles: CollectionConfig = {
  slug: 'community-profiles',
  admin: { hidden: true, useAsTitle: 'displayName' },
  access: {
    create: () => false,
    read: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, unique: true, index: true, maxDepth: 0 },
    { name: 'displayName', type: 'text', required: true },
    { name: 'selectedPet', type: 'select', required: true, options: ['turtle', 'rabbit', 'cat', 'snake'] },
    { name: 'level', type: 'number', required: true, defaultValue: 0 },
    { name: 'points', type: 'number', required: true, defaultValue: 0 },
    { name: 'currentStreak', type: 'number', required: true, defaultValue: 0 },
  ],
  timestamps: true,
}
