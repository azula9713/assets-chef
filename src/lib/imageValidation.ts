import type { UploadKind, ValidatedUpload } from './types'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

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

export async function validateUpload(
  file: File,
  kind: UploadKind,
): Promise<ValidatedUpload> {
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

  if (kind === 'icon' && width !== height) {
    throw createValidationError(
      'Icons must be square. Upload a 1:1 image for light and dark app icons.',
    )
  }

  if (kind === 'icon' && (width < 512 || height < 512)) {
    throw createValidationError(
      'Icons must be at least 512×512 to avoid unusably soft output.',
    )
  }

  const warnings: string[] = []

  if (kind === 'icon' && (width < 1024 || height < 1024)) {
    warnings.push(
      'Below 1024×1024: accepted, but exports may look soft at larger sizes.',
    )
  }

  if (kind === 'splash' && Math.min(width, height) < 1024) {
    warnings.push(
      'Shortest side below 1024px: accepted, but the splash image may lose sharpness.',
    )
  }

  return {
    file,
    height,
    kind,
    url: URL.createObjectURL(file),
    warnings,
    width,
  }
}
