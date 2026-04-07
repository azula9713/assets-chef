import { useEffect, useRef, useState } from 'react'

import { validateUpload } from '../imageValidation'
import type { UploadKind, UploadSlot } from '../types'
import { INITIAL_UPLOADS, type UploadState } from './config'
import { getErrorMessage } from './helpers'

type UseUploadsOptions = {
  onSuccessfulChange: () => void
}

function getUploadKind(slot: UploadSlot): UploadKind {
  return slot === 'splash' || slot === 'splashDark' ? 'splash' : 'icon'
}

export function useUploads({ onSuccessfulChange }: UseUploadsOptions) {
  const [uploads, setUploads] = useState<Record<UploadSlot, UploadState>>(INITIAL_UPLOADS)
  const uploadsRef = useRef(uploads)

  useEffect(() => {
    uploadsRef.current = uploads
  }, [uploads])

  useEffect(() => {
    return () => {
      for (const slot of Object.values(uploadsRef.current)) {
        if (slot.upload) URL.revokeObjectURL(slot.upload.url)
      }
    }
  }, [])

  async function updateUpload(slot: UploadSlot, file: File) {
    try {
      const nextUpload = await validateUpload(file, getUploadKind(slot))
      setUploads((current) => {
        const currentUrl = current[slot].upload?.url
        if (currentUrl) URL.revokeObjectURL(currentUrl)
        return { ...current, [slot]: { error: undefined, upload: nextUpload } }
      })
      onSuccessfulChange()
    } catch (error) {
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
    const currentUrl = uploads[slot].upload?.url
    if (currentUrl) URL.revokeObjectURL(currentUrl)
    setUploads((current) => ({ ...current, [slot]: {} }))
    onSuccessfulChange()
  }

  return {
    uploads,
    clearUpload,
    updateUpload,
  }
}
