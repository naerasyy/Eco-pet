import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

const COOKIE_NAME = 'app-session'

export function createAppAuth(collection: 'users') {
  return {
    async currentUser() {
      const token = (await cookies()).get(COOKIE_NAME)?.value
      if (!token) return null
      const payload = await getPayload({ config })
      const authHeaders = new Headers({ Authorization: `JWT ${token}` })
      const { user } = await payload.auth({ headers: authHeaders })
      if (!user || user.collection !== collection) return null
      return user
    },
    async login(email: string, password: string) {
      const payload = await getPayload({ config })
      const result = await payload.login({ collection, data: { email, password } })
      if (!result.token) throw new Error('Login gagal.')
      const store = await cookies()
      store.set(COOKIE_NAME, result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
      return result.user
    },
    async logout() {
      const store = await cookies()
      store.delete(COOKIE_NAME)
    },
  }
}

export const appAuth = createAppAuth('users')
