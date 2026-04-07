type Platform = 'expo' | 'ios' | 'android' | 'web'

export type PlatformFilter = 'all' | Platform

export type UploadKind = 'icon' | 'splash'

export type UploadSlot = 'light' | 'dark' | 'splash' | 'splashDark'

export type ValidatedUpload = {
  file: File
  height: number
  kind: UploadKind
  url: string
  warnings: string[]
  width: number
}

export type UserInputs = {
  adaptiveIconBackgroundColor: string
  appName: string
  appShortName: string
  darkIcon?: ValidatedUpload
  lightIcon: ValidatedUpload
  splashBackgroundDark: string
  splashBackgroundLight: string
  splashImage: ValidatedUpload
  splashImageDark?: ValidatedUpload
}

export type AssetEntry = {
  blob: Blob
  filename: string
}

export type AssetManifest = Record<Platform, AssetEntry[]>

export type GeneratedAssets = {
  appJsonText: string
  manifest: AssetManifest
  previews: {
    androidAdaptive: Blob
    iosIcon: Blob
    splash: Blob
    tinted: Blob
  }
}
