import JSZip from 'jszip'

import type { AssetManifest, PlatformFilter } from './types'

const PLATFORMS = ['expo', 'ios', 'android', 'web'] as const

export async function buildZip(
  manifest: AssetManifest,
  filter: PlatformFilter = 'all',
) {
  const zip = new JSZip()
  const platforms = filter === 'all' ? PLATFORMS : [filter]

  for (const platform of platforms) {
    const folder = zip.folder(platform)

    if (!folder) {
      throw new Error(`Unable to create the ${platform} folder in the ZIP.`)
    }

    for (const entry of manifest[platform]) {
      folder.file(entry.filename, entry.blob)
    }
  }

  return zip.generateAsync({ type: 'blob' })
}
