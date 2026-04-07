import pica from 'pica'

import type { CropArea } from './types'

const picaInstance = pica()

type CompositeOptions = {
  backgroundColor: string
  containRatio?: number
  height: number
  width: number
}

type ContainOptions = {
  backgroundColor?: string
  containRatio?: number
  height: number
  width: number
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function getContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to acquire a 2D canvas context in this browser.')
  }

  return context
}

async function blobToBitmap(blob: Blob) {
  return createImageBitmap(blob)
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('Failed to encode canvas output.'))
    }, type, quality)
  })
}

export async function createSolidImage(
  width: number,
  height: number,
  color: string,
) {
  const canvas = createCanvas(width, height)
  const context = getContext(canvas)
  context.fillStyle = color
  context.fillRect(0, 0, width, height)
  return canvasToBlob(canvas)
}

async function toSourceCanvas(source: Blob) {
  const bitmap = await blobToBitmap(source)
  const canvas = createCanvas(bitmap.width, bitmap.height)
  const context = getContext(canvas)
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvas
}

export async function resizeImage(
  source: Blob,
  width: number,
  height: number,
) {
  const sourceCanvas = await toSourceCanvas(source)
  const targetCanvas = createCanvas(width, height)
  await picaInstance.resize(sourceCanvas, targetCanvas, {
    alpha: true,
  })
  return canvasToBlob(targetCanvas)
}

export async function cropImage(
  source: Blob,
  crop: CropArea,
  outputWidth: number,
  outputHeight: number,
) {
  const bitmap = await blobToBitmap(source)
  const canvas = createCanvas(outputWidth, outputHeight)
  const context = getContext(canvas)

  context.drawImage(
    bitmap,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  )
  bitmap.close()

  return canvasToBlob(canvas)
}

export async function grayscaleImage(source: Blob) {
  const canvas = await toSourceCanvas(source)
  const context = getContext(canvas)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const luminance = Math.round(
      data[index] * 0.2126 +
        data[index + 1] * 0.7152 +
        data[index + 2] * 0.0722,
    )

    data[index] = luminance
    data[index + 1] = luminance
    data[index + 2] = luminance
  }

  context.putImageData(imageData, 0, 0)
  return canvasToBlob(canvas)
}

export async function compositeOnBackground(
  source: Blob,
  options: CompositeOptions,
) {
  const { containRatio = 0.52, ...rest } = options
  return containImage(source, { ...rest, containRatio })
}

export async function containImage(
  source: Blob,
  options: ContainOptions,
) {
  const { backgroundColor, containRatio = 1, height, width } = options
  const canvas = createCanvas(width, height)
  const context = getContext(canvas)

  if (backgroundColor) {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, width, height)
  }

  const bitmap = await blobToBitmap(source)
  const maxWidth = width * containRatio
  const maxHeight = height * containRatio
  const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height)
  const drawWidth = Math.max(1, Math.round(bitmap.width * scale))
  const drawHeight = Math.max(1, Math.round(bitmap.height * scale))
  bitmap.close()

  const resized = await resizeImage(source, drawWidth, drawHeight)
  const resizedBitmap = await blobToBitmap(resized)
  const offsetX = Math.round((width - drawWidth) / 2)
  const offsetY = Math.round((height - drawHeight) / 2)

  context.drawImage(resizedBitmap, offsetX, offsetY, drawWidth, drawHeight)
  resizedBitmap.close()

  return canvasToBlob(canvas)
}
