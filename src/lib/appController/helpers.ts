import { mergeAppJson } from '../appJson'
import type { AssetManifest, GeneratedAssets, PlatformFilter, UploadSlot, UserInputs } from '../types'
import type { AppConfig, UploadState } from './config'
import { UPLOAD_SLOT_TITLES } from './config'

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

function createAppJsonOptions(config: AppConfig, hasDarkIcon: boolean) {
  return {
    adaptiveIconBackgroundColor: config.adaptiveIconBackgroundColor,
    hasDarkIcon,
    splashBackgroundDark: config.splashBackgroundDark,
    splashBackgroundLight: config.splashBackgroundLight,
  }
}

export function buildAppJsonResult(config: AppConfig, pastedAppJson: string, hasDarkIcon: boolean) {
  return mergeAppJson(pastedAppJson, createAppJsonOptions(config, hasDarkIcon))
}

export function collectInputs(
  uploads: Record<UploadSlot, UploadState>,
  config: AppConfig,
): UserInputs | null {
  const lightIcon = uploads.light.upload
  const darkIcon = uploads.dark.upload
  const splashImage = uploads.splash.upload
  const splashImageDark = uploads.splashDark.upload

  if (!lightIcon || !splashImage || lightIcon.kind !== 'icon' || splashImage.kind !== 'splash') {
    return null
  }

  return {
    adaptiveIconBackgroundColor: config.adaptiveIconBackgroundColor,
    appName: config.appName,
    appShortName: config.appShortName,
    darkIcon: darkIcon?.kind === 'icon' ? darkIcon : undefined,
    lightIcon,
    splashBackgroundDark: config.splashBackgroundDark,
    splashBackgroundLight: config.splashBackgroundLight,
    splashImage,
    splashImageDark: splashImageDark?.kind === 'splash' ? splashImageDark : undefined,
  }
}

export function countAssets(generated: GeneratedAssets | null, filter: PlatformFilter) {
  if (!generated) return 0
  if (filter === 'all') {
    return Object.values(generated.manifest).reduce((sum, entries) => sum + entries.length, 0)
  }
  return generated.manifest[filter].length
}

export function withUpdatedAppJson(manifest: AssetManifest, appJsonText: string) {
  return {
    ...manifest,
    expo: manifest.expo.map((entry) =>
      entry.filename === 'app.json'
        ? { ...entry, blob: new Blob([appJsonText], { type: 'application/json' }) }
        : entry,
    ),
  }
}

export function withUpdatedSiteManifest(manifest: AssetManifest, siteManifestText: string) {
  return {
    ...manifest,
    web: manifest.web.map((entry) =>
      entry.filename === 'site.webmanifest'
        ? { ...entry, blob: new Blob([siteManifestText], { type: 'application/json' }) }
        : entry,
    ),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getPastedExpoName(appJsonText: string) {
  const trimmed = appJsonText.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!isRecord(parsed)) return null
    const expo = isRecord(parsed.expo) ? parsed.expo : parsed
    return typeof expo.name === 'string' && expo.name.trim() ? expo.name.trim() : null
  } catch {
    return null
  }
}

export function resolveWebManifestNames(config: AppConfig, pastedAppJson: string) {
  const pastedExpoName = getPastedExpoName(pastedAppJson)

  return {
    appName: config.appName.trim() || pastedExpoName || '',
    appShortName: config.appShortName.trim() || pastedExpoName || '',
    pastedExpoName,
  }
}

export function collectWarnings(uploads: Record<UploadSlot, UploadState>) {
  return Object.entries(uploads).flatMap(([slot, state]) =>
    (state.upload?.warnings ?? []).map(
      (warning) => `${UPLOAD_SLOT_TITLES[slot as UploadSlot]}: ${warning}`,
    ),
  )
}
