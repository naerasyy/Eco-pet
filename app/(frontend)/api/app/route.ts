import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { appAuth } from '@/lib/app-auth'

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const numberInRange = (value: unknown, min: number, max: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null
}

const safeUser = (user: Record<string, unknown>) => ({
  id: user.id,
  displayName: user.displayName,
  selectedPet: user.selectedPet,
  level: user.level ?? 0,
  xp: user.xp ?? 0,
  points: user.points ?? 0,
  ecoTokens: user.ecoTokens ?? 0,
  currentStreak: user.currentStreak ?? 0,
  longestStreak: user.longestStreak ?? 0,
  createdAt: user.createdAt,
  lastActiveDate: user.lastActiveDate,
  ownedAccessories: user.ownedAccessories ?? [],
  equippedAccessory: user.equippedAccessory ?? 'none',
})

export async function GET() {
  const user = await appAuth.currentUser()
  if (!user) return NextResponse.json({ authenticated: false })
  const payload = await getPayload({ config })
  const [activities, messages, people, friendships, diary] = await Promise.all([
    payload.find({ collection: 'activities', user, overrideAccess: false, depth: 1, limit: 40, sort: '-createdAt' }),
    payload.find({ collection: 'pet-messages', user, overrideAccess: false, limit: 60, sort: 'createdAt' }),
    payload.find({ collection: 'community-profiles', user, overrideAccess: false, depth: 0, limit: 50, sort: '-points' }),
    payload.find({ collection: 'friendships', user, overrideAccess: false, depth: 1, limit: 100, sort: '-createdAt' }),
    payload.find({ collection: 'diary-entries', user, overrideAccess: false, depth: 1, limit: 30, sort: '-createdAt' }),
  ])
  return NextResponse.json({
    authenticated: true,
    user: safeUser(user as unknown as Record<string, unknown>),
    activities: activities.docs,
    messages: messages.docs,
    people: people.docs.map((person) => ({
      id: typeof person.owner === 'object' ? person.owner.id : person.owner,
      displayName: person.displayName,
      selectedPet: person.selectedPet,
      level: person.level,
      points: person.points,
      currentStreak: person.currentStreak,
      xp: 0,
      ecoTokens: 0,
      longestStreak: person.currentStreak,
      createdAt: person.createdAt,
      ownedAccessories: [],
      equippedAccessory: 'none',
    })),
    friendships: friendships.docs,
    diary: diary.docs,
  })
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) return handleDiaryUpload(request)
    const body = await request.json() as Record<string, unknown>
    const action = text(body.action, 40)
    const payload = await getPayload({ config })

    if (action === 'signup') {
      const displayName = text(body.displayName, 24)
      const email = text(body.email, 120).toLowerCase()
      const password = text(body.password, 120)
      const selectedPet = (['turtle', 'rabbit', 'cat', 'snake'].includes(String(body.selectedPet)) ? body.selectedPet : 'turtle') as 'turtle' | 'rabbit' | 'cat' | 'snake'
      if (displayName.length < 2 || !email.includes('@') || password.length < 8) {
        return NextResponse.json({ ok: false, error: 'Isi nama, email valid, dan kata sandi minimal 8 karakter.' }, { status: 400 })
      }
      await payload.create({ collection: 'users', overrideAccess: false, data: { displayName, email, password, selectedPet } })
      await appAuth.login(email, password)
      return NextResponse.json({ ok: true })
    }
    if (action === 'login') {
      await appAuth.login(text(body.email, 120).toLowerCase(), text(body.password, 120))
      return NextResponse.json({ ok: true })
    }
    if (action === 'logout') {
      await appAuth.logout()
      return NextResponse.json({ ok: true })
    }

    const user = await appAuth.currentUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }, { status: 401 })

    if (action === 'activity') {
      const type = text(body.type, 30)
      const allowedTypes = ['transport', 'waste', 'energy', 'food', 'nature', 'education']
      if (!allowedTypes.includes(type)) return NextResponse.json({ ok: false, error: 'Jenis aktivitas tidak valid.' }, { status: 400 })
      const data: Record<string, unknown> = {
        title: text(body.title, 100),
        questKey: text(body.questKey, 80),
        type,
        visibility: body.visibility === 'private' ? 'private' : 'public',
      }
      if (!data.title || !data.questKey) return NextResponse.json({ ok: false, error: 'Aktivitas belum lengkap.' }, { status: 400 })
      if (type === 'transport') {
        const distanceKm = numberInRange(body.distanceKm, 0.1, 200)
        const durationMinutes = numberInRange(body.durationMinutes, 1, 600)
        if (distanceKm === null || durationMinutes === null) return NextResponse.json({ ok: false, error: 'Masukkan jarak dan durasi yang valid.' }, { status: 400 })
        data.distanceKm = distanceKm
        data.durationMinutes = durationMinutes
        data.transportMode = ['walk', 'bicycle', 'bus', 'train'].includes(String(body.transportMode)) ? body.transportMode : 'bus'
        data.alternativeMode = body.alternativeMode === 'motorcycle' ? 'motorcycle' : 'car'
      }
      const activity = await payload.create({ collection: 'activities', user, overrideAccess: false, data: data as any })
      return NextResponse.json({ ok: true, activity })
    }

    if (action === 'message') {
      const message = text(body.message, 500)
      if (!message) return NextResponse.json({ ok: false, error: 'Pesan tidak boleh kosong.' }, { status: 400 })
      await payload.create({ collection: 'pet-messages', user, overrideAccess: false, data: { owner: user.id, sender: 'user', message } })
      const lower = message.toLowerCase()
      const reply = lower.includes('ngapain') || lower.includes('apa yang kamu lakukan')
        ? 'Aku lagi mengecek tanaman dan menunggumu menyelesaikan aksi hijau. Mau jalan-jalan di habitat?'
        : lower.includes('makan')
          ? 'Aku baru makan buah lokal. Makanan lokal biasanya menempuh jarak lebih pendek dan emisinya lebih kecil.'
          : lower.includes('kabar')
            ? 'Aku baik! Kondisi habitatku mengikuti aktivitas nyata akunmu hari ini.'
            : 'Aku dengar. Kamu bisa cerita soal harimu, tanya tentang lingkungan, atau ajak aku memilih quest.'
      await payload.create({ collection: 'pet-messages', user, overrideAccess: false, data: { owner: user.id, sender: 'pet', message: reply } })
      return NextResponse.json({ ok: true, reply })
    }

    if (action === 'friend-request') {
      const recipient = text(body.recipient, 100)
      if (!recipient || recipient === String(user.id)) return NextResponse.json({ ok: false, error: 'Pilih pengguna lain.' }, { status: 400 })
      const target = await payload.find({ collection: 'community-profiles', user, overrideAccess: false, limit: 1, where: { owner: { equals: recipient } } })
      if (!target.totalDocs) return NextResponse.json({ ok: false, error: 'Pengguna tidak ditemukan.' }, { status: 404 })
      const existing = await payload.find({ collection: 'friendships', user, overrideAccess: false, limit: 1, where: { or: [{ and: [{ requester: { equals: user.id } }, { recipient: { equals: recipient } }] }, { and: [{ requester: { equals: recipient } }, { recipient: { equals: user.id } }] }] } })
      if (existing.totalDocs) return NextResponse.json({ ok: false, error: 'Permintaan pertemanan sudah ada.' }, { status: 409 })
      await payload.create({ collection: 'friendships', user, overrideAccess: false, data: { requester: user.id, recipient, status: 'pending' } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Aksi tidak dikenal.' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan.'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

async function handleDiaryUpload(request: Request) {
  const user = await appAuth.currentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Silakan masuk lagi.' }, { status: 401 })
  const form = await request.formData()
  const title = text(form.get('title'), 100)
  const story = text(form.get('story'), 1000)
  const file = form.get('photo')
  if (!title || !story) return NextResponse.json({ ok: false, error: 'Judul dan cerita wajib diisi.' }, { status: 400 })
  const payload = await getPayload({ config })
  let photo: string | undefined
  if (file instanceof File && file.size > 0) {
    if (file.size > 5_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'Foto harus JPG, PNG, atau WebP maksimal 5 MB.' }, { status: 400 })
    }
    const uploaded = await payload.create({
      collection: 'diary-media',
      user,
      overrideAccess: false,
      data: { alt: title, owner: user.id },
      file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name, size: file.size },
    })
    photo = uploaded.id
  }
  const entry = await payload.create({ collection: 'diary-entries', user, overrideAccess: false, data: { owner: user.id, title, story, photo, visibility: form.get('visibility') === 'public' ? 'public' : 'private' } })
  return NextResponse.json({ ok: true, entry })
}
