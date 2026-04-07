import { useEffect, useRef } from 'react'

type PreviewCanvasProps = {
  blob?: Blob
  label: string
}

export function PreviewCanvas({ blob, label }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)

    if (!blob) {
      return
    }

    let isCancelled = false
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      if (isCancelled) {
        return
      }

      const width = canvas.width
      const height = canvas.height
      const scale = Math.min(width / image.width, height / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      const offsetX = (width - drawWidth) / 2
      const offsetY = (height - drawHeight) / 2

      context.clearRect(0, 0, width, height)
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
    }

    image.src = url

    return () => {
      isCancelled = true
      URL.revokeObjectURL(url)
    }
  }, [blob])

  return (
    <figure className="preview-card">
      <canvas
        aria-label={label}
        className="preview-canvas"
        height={320}
        ref={canvasRef}
        width={320}
      />
      <figcaption>{label}</figcaption>
    </figure>
  )
}
