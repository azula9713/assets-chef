import { cropImage } from './imageProcessor'
import type {
  CropArea,
  IconCropStatus,
  ImageSource,
  ValidatedIconUpload,
  ValidatedSplashUpload,
} from './types'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])
const ICON_MIN_PIXELS = 512
const ICON_RECOMMENDED_PIXELS = 1024
const CANONICAL_ICON_PIXELS = 1024
const ICON_SOFT_WARNING =
  'Cropped source is below 1024×1024: accepted, but exports may look soft at larger sizes.'

function getFileExtension(fileName: string) {
  const segments = fileName.toLowerCase().split('.')
  return segments.length > 1 ? segments.at(-1) ?? '' : ''
}

function isSupportedImage(file: File) {
  const extension = getFileExtension(file.name)
  return ALLOWED_TYPES.has(file.type) || ALLOWED_EXTENSIONS.has(extension)
}

function createValidationError(message: string) {
  return new Error(message)
}

function createObjectUrl(file: Blob) {
  return URL.createObjectURL(file)
}

export function revokeImageSource(source: ImageSource) {
  URL.revokeObjectURL(source.url)
}

export function revokeUploadUrls(
  upload: ValidatedIconUpload | ValidatedSplashUpload,
  preservedSourceUrl?: string,
) {
  URL.revokeObjectURL(upload.url)

  if (
    upload.kind === 'icon' &&
    upload.source.url !== upload.url &&
    upload.source.url !== preservedSourceUrl
  ) {
    revokeImageSource(upload.source)
  }
}

export function getDefaultCropArea(source: Pick<ImageSource, 'height' | 'width'>): CropArea {
  const size = Math.min(source.width, source.height)

  return {
    height: size,
    width: size,
    x: Math.round((source.width - size) / 2),
    y: Math.round((source.height - size) / 2),
  }
}

export function normalizeCropArea(area: CropArea): CropArea {
  const size = Math.max(1, Math.round(Math.min(area.width, area.height)))

  return {
    height: size,
    width: size,
    x: Math.max(0, Math.round(area.x)),
    y: Math.max(0, Math.round(area.y)),
  }
}

function cropMatches(left: CropArea, right: CropArea) {
  const tolerance = 1

  return (
    Math.abs(left.x - right.x) <= tolerance &&
    Math.abs(left.y - right.y) <= tolerance &&
    Math.abs(left.width - right.width) <= tolerance &&
    Math.abs(left.height - right.height) <= tolerance
  )
}

function iconWarnings(effectivePixels: number) {
  const warnings: string[] = []
  const { warning } = getIconCropFeedback(effectivePixels)

  if (warning) {
    warnings.push(warning)
  }

  return warnings
}

export function getIconCropFeedback(effectivePixels: number) {
  const error =
    effectivePixels < ICON_MIN_PIXELS
      ? 'Crop must keep at least 512×512 pixels to avoid unusably soft output.'
      : null
  const warning =
    !error && effectivePixels < ICON_RECOMMENDED_PIXELS
      ? ICON_SOFT_WARNING
      : null

  return { error, warning }
}

function getIconCropError(effectivePixels: number) {
  return getIconCropFeedback(effectivePixels).error
}

function getIconCropStatus(source: ImageSource, cropArea: CropArea): IconCropStatus {
  const defaultCrop = getDefaultCropArea(source)
  const matchesDefault = cropMatches(cropArea, defaultCrop)

  if (source.width === source.height && matchesDefault) {
    return 'original'
  }

  if (matchesDefault) {
    return 'auto'
  }

  return 'custom'
}

export function getIconStatusLabel(status: IconCropStatus) {
  switch (status) {
    case 'auto':
      return 'Auto-cropped'
    case 'custom':
      return 'Custom Crop'
    case 'original':
      return 'Original framing'
  }
}

export async function loadImageSource(file: File): Promise<ImageSource> {
  const extension = getFileExtension(file.name)

  if (file.type === 'image/svg+xml' || extension === 'svg') {
    throw createValidationError(
      'SVG is not supported. Upload a PNG, JPG, or WebP instead.',
    )
  }

  if (!isSupportedImage(file)) {
    throw createValidationError('Use a PNG, JPG, or WebP image.')
  }

  const bitmap = await createImageBitmap(file)
  const width = bitmap.width
  const height = bitmap.height
  bitmap.close()

  return {
    file,
    height,
    url: createObjectUrl(file),
    width,
  }
}

export async function createIconUpload(
  source: ImageSource,
  cropArea: CropArea,
): Promise<ValidatedIconUpload> {
  const normalizedCrop = normalizeCropArea(cropArea)
  const effectivePixels = normalizedCrop.width
  const error = getIconCropError(effectivePixels)

  if (error) {
    throw createValidationError(error)
  }

  const blob = await cropImage(
    source.file,
    normalizedCrop,
    CANONICAL_ICON_PIXELS,
    CANONICAL_ICON_PIXELS,
  )

  return {
    blob,
    crop: {
      area: normalizedCrop,
      effectivePixels,
      status: getIconCropStatus(source, normalizedCrop),
    },
    height: CANONICAL_ICON_PIXELS,
    kind: 'icon',
    source,
    url: createObjectUrl(blob),
    warnings: iconWarnings(effectivePixels),
    width: CANONICAL_ICON_PIXELS,
  }
}

export async function validateSplashUpload(file: File): Promise<ValidatedSplashUpload> {
  const source = await loadImageSource(file)
  const warnings: string[] = []

  if (Math.min(source.width, source.height) < 1024) {
    warnings.push(
      'Shortest side below 1024px: accepted, but the splash image may lose sharpness.',
    )
  }

  return {
    file: source.file,
    height: source.height,
    kind: 'splash',
    url: source.url,
    warnings,
    width: source.width,
  }
}
