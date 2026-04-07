import { useEffect, useRef, useState } from 'react'

import {
  createIconUpload,
  getDefaultCropArea,
  loadImageSource,
  revokeImageSource,
  revokeUploadUrls,
  validateSplashUpload,
} from '../imageValidation'
import type {
  CropArea,
  IconUploadSlot,
  ImageSource,
  UploadSlot,
} from '../types'
import { INITIAL_UPLOADS, type UploadState } from './config'
import { getErrorMessage } from './helpers'

type UseUploadsOptions = {
  onSuccessfulChange: () => void
}

type CropDialogMode = 'edit' | 'new-upload'

type CropDialogState = {
  defaultCropArea: CropArea
  initialCropArea: CropArea
  mode: CropDialogMode
  slot: IconUploadSlot
  source: ImageSource
}

const INITIAL_AUTO_CROP: Record<IconUploadSlot, boolean> = {
  dark: true,
  light: true,
}

function isIconSlot(slot: UploadSlot): slot is IconUploadSlot {
  return slot === 'dark' || slot === 'light'
}

function releaseUpload(upload?: UploadState['upload'], preservedSourceUrl?: string) {
  if (!upload) return

  revokeUploadUrls(upload, preservedSourceUrl)
}

export function useUploads({ onSuccessfulChange }: UseUploadsOptions) {
  const [uploads, setUploads] = useState<Record<UploadSlot, UploadState>>(INITIAL_UPLOADS)
  const [autoCrop, setAutoCrop] = useState<Record<IconUploadSlot, boolean>>(INITIAL_AUTO_CROP)
  const [cropDialog, setCropDialog] = useState<CropDialogState | null>(null)
  const uploadsRef = useRef(uploads)
  const cropDialogRef = useRef(cropDialog)

  useEffect(() => {
    uploadsRef.current = uploads
  }, [uploads])

  useEffect(() => {
    cropDialogRef.current = cropDialog
  }, [cropDialog])

  useEffect(() => {
    return () => {
      for (const slot of Object.values(uploadsRef.current)) {
        releaseUpload(slot.upload)
      }

      const currentDialog = cropDialogRef.current

      if (currentDialog?.mode === 'new-upload') {
        revokeImageSource(currentDialog.source)
      }
    }
  }, [])

  function setUpload(slot: UploadSlot, nextUpload: UploadState['upload']) {
    setUploads((current) => {
      const previousUpload = current[slot].upload
      const preservedSourceUrl =
        previousUpload?.kind === 'icon' && nextUpload?.kind === 'icon'
          ? nextUpload.source.url
          : undefined

      releaseUpload(previousUpload, preservedSourceUrl)

      return {
        ...current,
        [slot]: {
          error: undefined,
          upload: nextUpload,
        },
      }
    })
  }

  async function updateUpload(slot: UploadSlot, file: File) {
    let source: ImageSource | null = null

    try {
      if (!isIconSlot(slot)) {
        const nextUpload = await validateSplashUpload(file)
        setUpload(slot, nextUpload)
        onSuccessfulChange()
        return
      }

      source = await loadImageSource(file)
      const defaultCropArea = getDefaultCropArea(source)
      const shouldOpenCropImmediately = !autoCrop[slot] && source.width !== source.height

      if (shouldOpenCropImmediately) {
        setUploads((current) => {
          releaseUpload(current[slot].upload)

          return {
            ...current,
            [slot]: {
              error: undefined,
              upload: undefined,
            },
          }
        })

        setCropDialog({
          defaultCropArea,
          initialCropArea: defaultCropArea,
          mode: 'new-upload',
          slot,
          source,
        })
        onSuccessfulChange()
        return
      }

      const nextUpload = await createIconUpload(source, defaultCropArea)
      setUpload(slot, nextUpload)
      onSuccessfulChange()
    } catch (error) {
      if (source) {
        revokeImageSource(source)
      }

      setUploads((current) => ({
        ...current,
        [slot]: {
          error: getErrorMessage(error),
          upload: current[slot].upload,
        },
      }))
    }
  }

  function clearUpload(slot: UploadSlot) {
    setUploads((current) => {
      releaseUpload(current[slot].upload)
      return { ...current, [slot]: {} }
    })
    onSuccessfulChange()
  }

  function setAutoCropEnabled(slot: IconUploadSlot, enabled: boolean) {
    setAutoCrop((current) => ({ ...current, [slot]: enabled }))
  }

  function openCropDialog(slot: IconUploadSlot) {
    const upload = uploadsRef.current[slot].upload

    if (!upload || upload.kind !== 'icon') {
      return
    }

    setCropDialog({
      defaultCropArea: getDefaultCropArea(upload.source),
      initialCropArea: upload.crop.area,
      mode: 'edit',
      slot,
      source: upload.source,
    })
  }

  function closeCropDialog() {
    const currentDialog = cropDialogRef.current

    if (currentDialog?.mode === 'new-upload') {
      revokeImageSource(currentDialog.source)
    }

    setCropDialog(null)
  }

  async function saveCrop(slot: IconUploadSlot, cropArea: CropArea) {
    const currentDialog = cropDialogRef.current

    if (!currentDialog || currentDialog.slot !== slot) {
      return
    }

    const nextUpload = await createIconUpload(currentDialog.source, cropArea)
    setUpload(slot, nextUpload)
    setCropDialog(null)
    onSuccessfulChange()
  }

  return {
    autoCrop,
    clearUpload,
    closeCropDialog,
    cropDialog,
    openCropDialog,
    saveCrop,
    setAutoCropEnabled,
    updateUpload,
    uploads,
  }
}
