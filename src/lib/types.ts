type Platform = 'expo' | 'ios' | 'android' | 'web'

export type PlatformFilter = 'all' | Platform

type UploadKind = 'icon' | 'splash'

export type UploadSlot = 'light' | 'dark' | 'splash' | 'splashDark'

export type IconUploadSlot = Extract<UploadSlot, 'light' | 'dark'>

export type CropArea = {
  height: number
  width: number
  x: number
  y: number
}

export type IconCropStatus = 'auto' | 'custom' | 'original'

export type ImageSource = {
  file: File
  height: number
  url: string
  width: number
}

type IconCrop = {
  area: CropArea
  effectivePixels: number
  status: IconCropStatus
}

type BaseValidatedUpload = {
  height: number
  kind: UploadKind
  url: string
  warnings: string[]
  width: number
}

export type ValidatedIconUpload = BaseValidatedUpload & {
  blob: Blob
  crop: IconCrop
  kind: 'icon'
  source: ImageSource
}

export type ValidatedSplashUpload = BaseValidatedUpload & {
  file: File
  kind: 'splash'
}

export type ValidatedUpload = ValidatedIconUpload | ValidatedSplashUpload

export type UserInputs = {
  adaptiveIconBackgroundColor: string
  appName: string
  appShortName: string
  darkIcon?: ValidatedIconUpload
  lightIcon: ValidatedIconUpload
  splashBackgroundDark: string
  splashBackgroundLight: string
  splashImage: ValidatedSplashUpload
  splashImageDark?: ValidatedSplashUpload
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
