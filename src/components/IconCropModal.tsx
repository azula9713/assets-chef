import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import Cropper, {
  getInitialCropFromCroppedAreaPixels,
  type MediaSize,
  type Point,
  type Size,
} from 'react-easy-crop'

import { getIconCropFeedback, normalizeCropArea } from '../lib/imageValidation'
import type { CropArea, IconUploadSlot } from '../lib/types'

type IconCropModalProps = {
  draft: {
    defaultCropArea: CropArea
    initialCropArea: CropArea
    slot: IconUploadSlot
    source: {
      height: number
      url: string
      width: number
    }
  } | null
  onCancel: () => void
  onSave: (slot: IconUploadSlot, cropArea: CropArea) => void
  title: string
}

const MAX_ZOOM = 4

export function IconCropModal({
  draft,
  onCancel,
  onSave,
  title,
}: Readonly<IconCropModalProps>) {
  const titleId = useId()
  const frameRef = useRef<HTMLDivElement>(null)
  const initKeyRef = useRef<string | null>(null)
  const mediaSizeRef = useRef<MediaSize | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(1)
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null)
  const [cropSize, setCropSize] = useState<Size | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    draft?.initialCropArea ?? null,
  )

  const maybeInitialize = useCallback((nextMediaSize: MediaSize, nextCropSize: Size) => {
    if (!draft) {
      return
    }

    const initKey = `${draft.source.url}:${nextCropSize.width}:${nextCropSize.height}`

    if (initKeyRef.current === initKey) {
      return
    }

    const nextMinZoom = Math.max(
      nextCropSize.width / nextMediaSize.width,
      nextCropSize.height / nextMediaSize.height,
      1,
    )

    const initial = getInitialCropFromCroppedAreaPixels(
      draft.initialCropArea,
      nextMediaSize,
      0,
      nextCropSize,
      nextMinZoom,
      MAX_ZOOM,
    )

    initKeyRef.current = initKey
    setMinZoom(nextMinZoom)
    setCrop(initial.crop)
    setZoom(initial.zoom)
    setCroppedAreaPixels(draft.initialCropArea)
  }, [draft])

  useEffect(() => {
    if (!draft) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [draft])

  useEffect(() => {
    if (!draft) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown)
    return () => globalThis.removeEventListener('keydown', handleKeyDown)
  }, [draft, onCancel])

  useEffect(() => {
    const frame = frameRef.current

    if (!frame) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextFrameSize = Math.max(220, Math.min(entry.contentRect.width * 0.72, 320))
      const nextCropSize = {
        height: nextFrameSize,
        width: nextFrameSize,
      }

      setCropSize(nextCropSize)

      if (mediaSizeRef.current) {
        maybeInitialize(mediaSizeRef.current, nextCropSize)
      }
    })

    observer.observe(frame)
    return () => observer.disconnect()
  }, [maybeInitialize])

  const effectivePixels = croppedAreaPixels?.width ?? draft?.initialCropArea.width ?? 0
  const feedback = getIconCropFeedback(effectivePixels)
  const message =
    feedback.error
      ? { intent: 'error' as const, text: feedback.error }
      : feedback.warning
        ? { intent: 'warning' as const, text: feedback.warning }
        : null
  const saveDisabled = Boolean(message?.intent === 'error' || !draft || !croppedAreaPixels)
  const sourceMeta = useMemo(() => {
    if (!draft) {
      return ''
    }

    return `Source: ${draft.source.width}×${draft.source.height} -> Crop: 1024×1024`
  }, [draft])

  if (!draft) {
    return null
  }

  const currentDraft = draft

  function applyCropArea(area: CropArea) {
    if (!mediaSize || !cropSize) {
      return
    }

    const nextMinZoom = Math.max(
      cropSize.width / mediaSize.width,
      cropSize.height / mediaSize.height,
      1,
    )

    const nextValues = getInitialCropFromCroppedAreaPixels(
      area,
      mediaSize,
      0,
      cropSize,
      nextMinZoom,
      MAX_ZOOM,
    )

    setMinZoom(nextMinZoom)
    setCrop(nextValues.crop)
    setZoom(nextValues.zoom)
    setCroppedAreaPixels(area)
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onCancel()
    }
  }

  function handleSave() {
    if (!croppedAreaPixels) {
      return
    }

    onSave(currentDraft.slot, croppedAreaPixels)
  }

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="crop-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
    >
      <div className="crop-modal card">
        <div className="crop-modal-head">
          <div>
            <h3 className="crop-modal-title" id={titleId}>{title}</h3>
            <p className="crop-modal-meta">{sourceMeta}</p>
          </div>
        </div>

        <div className="crop-modal-body">
          <div className="crop-stage" ref={frameRef}>
            <Cropper
              aspect={1}
              classes={{
                containerClassName: 'cropper-container',
                cropAreaClassName: 'cropper-area',
                mediaClassName: 'cropper-media',
              }}
              crop={crop}
              cropShape="rect"
              cropSize={cropSize ?? undefined}
              image={currentDraft.source.url}
              maxZoom={MAX_ZOOM}
              minZoom={minZoom}
              objectFit="contain"
              onCropAreaChange={(_, areaPixels) =>
                setCroppedAreaPixels(normalizeCropArea(areaPixels))
              }
              onCropChange={setCrop}
              onMediaLoaded={(nextMediaSize) => {
                mediaSizeRef.current = nextMediaSize
                setMediaSize(nextMediaSize)

                if (cropSize) {
                  maybeInitialize(nextMediaSize, cropSize)
                }
              }}
              onZoomChange={setZoom}
              restrictPosition
              rotation={0}
              showGrid={false}
              style={{
                containerStyle: {
                  background:
                    'conic-gradient(rgba(28, 24, 20, 0.92) 25%, rgba(21, 18, 14, 0.92) 25% 50%, rgba(28, 24, 20, 0.92) 50% 75%, rgba(21, 18, 14, 0.92) 75%) top left / 24px 24px repeat',
                  borderRadius: '22px',
                },
                cropAreaStyle: {
                  border: '1.5px solid rgba(255, 255, 255, 0.92)',
                  boxShadow: '0 0 0 9999px rgba(8, 7, 6, 0.62)',
                },
                mediaStyle: {
                  cursor: 'grab',
                },
              }}
              zoom={zoom}
              zoomSpeed={0.18}
              zoomWithScroll
            />
          </div>

          <div className="crop-controls">
            <label className="crop-zoom" htmlFor={`${titleId}-zoom`}>
              <span>Zoom</span>
              <input
                id={`${titleId}-zoom`}
                max={MAX_ZOOM}
                min={minZoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                step={0.01}
                type="range"
                value={zoom}
              />
            </label>

            {message ? (
              <p className={`crop-message crop-message--${message.intent}`}>{message.text}</p>
            ) : (
              <p className="crop-message">Drag to pan and use the slider or scroll to zoom.</p>
            )}
          </div>
        </div>

        <div className="crop-modal-actions">
          <button className="btn-clear" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="btn-clear"
            onClick={() => applyCropArea(currentDraft.defaultCropArea)}
            type="button"
          >
            Reset
          </button>
          <button
            className="btn btn--primary"
            disabled={saveDisabled}
            onClick={handleSave}
            type="button"
          >
            Save crop
          </button>
        </div>
      </div>
    </div>
  )
}
