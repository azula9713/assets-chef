import type { PlatformFilter, UploadSlot, ValidatedUpload } from '../types'

export type UploadState = {
  error?: string
  upload?: ValidatedUpload
}

export type AppConfig = {
  adaptiveIconBackgroundColor: string
  appName: string
  appShortName: string
  splashBackgroundDark: string
  splashBackgroundLight: string
}

export const PLATFORM_OPTIONS: Array<{ label: string; value: PlatformFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Expo', value: 'expo' },
  { label: 'iOS', value: 'ios' },
  { label: 'Android', value: 'android' },
  { label: 'Web', value: 'web' },
]

export const UPLOAD_SLOTS: Array<{ description: string; slot: UploadSlot; title: string }> = [
  {
    description: 'Required square icon, 1024\u00d71024+ recommended. PNG, JPG, or WebP.',
    slot: 'light',
    title: 'Light Icon',
  },
  {
    description: 'Optional. Falls back to the light icon if omitted.',
    slot: 'dark',
    title: 'Dark Icon',
  },
  {
    description: 'Required splash artwork, any aspect ratio.',
    slot: 'splash',
    title: 'Splash \u00b7 Light',
  },
  {
    description: 'Optional. Falls back to light splash if omitted.',
    slot: 'splashDark',
    title: 'Splash \u00b7 Dark',
  },
]

export const UPLOAD_SLOT_TITLES: Record<UploadSlot, string> = {
  dark: 'Dark Icon',
  light: 'Light Icon',
  splash: 'Splash \u00b7 Light',
  splashDark: 'Splash \u00b7 Dark',
}

export const INITIAL_UPLOADS: Record<UploadSlot, UploadState> = {
  dark: {},
  light: {},
  splash: {},
  splashDark: {},
}

export const INITIAL_CONFIG: AppConfig = {
  adaptiveIconBackgroundColor: '#101A2B',
  appName: '',
  appShortName: '',
  splashBackgroundDark: '#0B1220',
  splashBackgroundLight: '#F4F1E8',
}

export function optionLabel(filter: Exclude<PlatformFilter, 'all'>) {
  switch (filter) {
    case 'android': return 'Android'
    case 'expo': return 'Expo'
    case 'ios': return 'iOS'
    case 'web': return 'Web'
  }
}
