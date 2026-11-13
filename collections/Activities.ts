import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { appUserOnly, isAppUser, ownOrPublicDocuments } from '@/access/appAccess'

const emissionFactors: Record<string, number> = {
  walk: 0,
  bicycle: 0,
  bus: 0.089,
  train: 0.041,
  car: 0.192,
  motorcycle: 0.103,
}

const prepareActivity: CollectionBeforeChangeHook = ({ data, req, operation }) => {
  if (!isAppUser(req.user)) throw new Error('Kamu harus masuk untuk mencatat aktivitas.')
  if (operation === 'create') {
    data.owner = req.user.id
    data.ownerDisplayName = (req.user as { displayName?: string }).displayName || 'Penjaga'
  }

  if (data.type === 'transport') {
    const distance = Number(data.distanceKm)
    const duration = Number(data.durationMinutes)
    if (!Number.isFinite(distance) || distance < 0.1 || distance > 200) throw new Error('Jarak harus antara 0,1 dan 200 km.')
    if (!Number.isFinite(duration) || duration < 1 || duration > 600) throw new Error('Durasi harus antara 1 dan 600 menit.')
    const chosen = emissionFactors[String(data.transportMode)] ?? 0
    const alternative = emissionFactors[String(data.alternativeMode)] ?? emissionFactors.car
    data.actualEmissionsKg = Number((chosen * distance).toFixed(3))
    data.avoidedEmissionsKg = Number((Math.max(0, alternative - chosen) * distance).toFixed(3))
  } else {
    data.actualEmissionsKg = 0
    data.avoidedEmissionsKg = Number(data.avoidedEmissionsKg || 0)
  }

  const saved = Number(data.avoidedEmissionsKg || 0)
  data.pointsEarned = Math.max(10, Math.round(20 + saved * 20))
  return data
}

const updateProgress: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || !isAppUser(req.user)) return
  const user = await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
    overrideAccess: true,
    req,
  })
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const lastKey = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().slice(0, 10) : null
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)
  const currentStreak = lastKey === todayKey ? Number(user.currentStreak || 0) : lastKey === yesterdayKey ? Number(user.currentStreak || 0) + 1 : 1
  const xp = Number(user.xp || 0) + Number(doc.pointsEarned || 0)
  await req.payload.update({
    collection: 'users',
    id: req.user.id,
    data: {
      xp,
      level: Math.floor(xp / 500),
      points: Number(user.points || 0) + Number(doc.pointsEarned || 0),
      ecoTokens: Number(user.ecoTokens || 0) + Math.max(1, Math.round(Number(doc.pointsEarned || 0) / 10)),
      currentStreak,
      longestStreak: Math.max(Number(user.longestStreak || 0), currentStreak),
      lastActiveDate: today.toISOString(),
    },
    overrideAccess: true,
    req,
  })
}

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'type', 'owner', 'createdAt'] },
  access: {
    create: appUserOnly,
    read: ownOrPublicDocuments,
    update: () => false,
    delete: ({ req }) => (isAppUser(req.user) ? { owner: { equals: req.user.id } } : false),
  },
  hooks: {
    beforeChange: [prepareActivity],
    afterChange: [updateProgress],
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true, maxDepth: 0, access: { create: () => false, update: () => false } },
    { name: 'ownerDisplayName', type: 'text', required: true, access: { create: () => false, update: () => false } },
    { name: 'title', type: 'text', required: true, maxLength: 100 },
    { name: 'type', type: 'select', required: true, options: ['transport', 'waste', 'energy', 'food', 'nature', 'education'] },
    { name: 'questKey', type: 'text', required: true, index: true },
    { name: 'visibility', type: 'select', required: true, defaultValue: 'public', options: ['private', 'friends', 'public'] },
    { name: 'transportMode', type: 'select', options: ['walk', 'bicycle', 'bus', 'train'], admin: { condition: (_, data) => data.type === 'transport' } },
    { name: 'alternativeMode', type: 'select', defaultValue: 'car', options: ['car', 'motorcycle'], admin: { condition: (_, data) => data.type === 'transport' } },
    { name: 'distanceKm', type: 'number', min: 0.1, max: 200 },
    { name: 'durationMinutes', type: 'number', min: 1, max: 600 },
    { name: 'actualEmissionsKg', type: 'number', access: { create: () => false, update: () => false } },
    { name: 'avoidedEmissionsKg', type: 'number', access: { create: () => false, update: () => false } },
    { name: 'pointsEarned', type: 'number', access: { create: () => false, update: () => false } },
  ],
  timestamps: true,
}
