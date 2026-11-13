import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from './importMap'

// Halaman /admin (tanpa segmen). Pasangan dari folder [...segments].
// Setara dengan [[...segments]] bawaan Payload: segments sengaja kosong (undefined).
type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

const rootParams = Promise.resolve({} as { segments: string[] })

export const generateMetadata = ({ searchParams }: Pick<Args, 'searchParams'>): Promise<Metadata> =>
  generatePageMetadata({ config, params: rootParams, searchParams })

const Page = ({ searchParams }: Pick<Args, 'searchParams'>) =>
  RootPage({ config, params: rootParams, searchParams, importMap })

export default Page
