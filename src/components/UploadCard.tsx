import { useId, useState, type ChangeEvent, type DragEvent } from 'react'

import { getIconStatusLabel } from '../lib/imageValidation'
import type { ValidatedUpload } from '../lib/types'

type UploadCardProps = {
  error?: string
  onAdjustCrop?: () => void
  onClear: () => void
  onFileSelected: (file: File) => void
  required?: boolean
  title: string
  upload?: ValidatedUpload
}

type UploadDropzoneProps = Pick<UploadCardProps, 'onFileSelected' | 'title' | 'upload'>

type UploadFooterProps = Pick<UploadCardProps, 'error' | 'onAdjustCrop' | 'onClear' | 'upload'>

function uploadName(upload: ValidatedUpload) {
  return upload.kind === 'icon' ? upload.source.file.name : upload.file.name
}

function sourceDimensions(upload: ValidatedUpload) {
  if (upload.kind === 'icon') {
    return `${upload.source.width}×${upload.source.height}`
  }

  return `${upload.width}×${upload.height}`
}

function cropDimensions(upload: ValidatedUpload) {
  if (upload.kind !== 'icon') {
    return null
  }

  return `${upload.width}×${upload.height}`
}

function hasFooterContent(upload?: ValidatedUpload, error?: string) {
  const warningCount = upload ? upload.warnings.length : 0
  return Boolean(upload || error || warningCount)
}

export function UploadCard({
  error,
  onAdjustCrop,
  onClear,
  onFileSelected,
  required,
  title,
  upload,
}: Readonly<UploadCardProps>) {
  return (
    <article className="upload-card card">
      <div className="upload-card-main">
        <div className="upload-card-head">
          <div className="upload-card-title">
            {title}{required && <span className="required-mark" aria-hidden="true"> *</span>}
          </div>
        </div>

        <div className="upload-card-body">
          <UploadDropzone
            onFileSelected={onFileSelected}
            title={title}
            upload={upload}
          />
        </div>
      </div>

      {hasFooterContent(upload, error) ? (
        <UploadFooter
          error={error}
          onAdjustCrop={onAdjustCrop}
          onClear={onClear}
          upload={upload}
        />
      ) : null}
    </article>
  )
}

function UploadDropzone({
  onFileSelected,
  title,
  upload,
}: Readonly<UploadDropzoneProps>) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const filledClassName = upload ? ' filled' : ''
  const draggingClassName = isDragging ? ' dragging' : ''

  function selectFile(file: File | null) {
    if (file) {
      onFileSelected(file)
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    selectFile(event.dataTransfer.files.item(0))
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.item(0) ?? null)
    event.target.value = ''
  }

  return (
    <label
      className={`dropzone${draggingClassName}${filledClassName}`}
      htmlFor={inputId}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        accept=".png,.jpg,.jpeg,.webp"
        className="sr-only"
        id={inputId}
        onChange={handleFileInput}
        type="file"
      />

      {upload ? <UploadPreview title={title} upload={upload} /> : <UploadEmptyState />}
    </label>
  )
}

function UploadPreview({
  title,
  upload,
}: Readonly<{ title: string; upload: ValidatedUpload }>) {
  const cropSize = cropDimensions(upload)
  const statusLabel = upload.kind === 'icon' ? getIconStatusLabel(upload.crop.status) : null

  return (
    <div className="upload-preview">
      <img
        alt={`${title} preview`}
        className="upload-thumb"
        height={48}
        src={upload.url}
        width={48}
      />
      <div className="upload-meta">
        <strong>{uploadName(upload)}</strong>
        <span className="upload-meta-line">Source: {sourceDimensions(upload)}</span>
        {cropSize ? <span className="upload-meta-line">Crop: {cropSize}</span> : null}
      </div>
      {statusLabel ? <span className="upload-status-pill">{statusLabel}</span> : null}
    </div>
  )
}

function UploadEmptyState() {
  return (
    <div className="upload-empty">
      <svg
        className="upload-empty-icon"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <strong>Drop image here</strong>
      <span>or click to browse</span>
      <small>PNG, JPG, or WebP</small>
    </div>
  )
}

function UploadFooter({
  error,
  onAdjustCrop,
  onClear,
  upload,
}: Readonly<UploadFooterProps>) {
  return (
    <div className="upload-card-footer">
      <div className="upload-card-footer-messages">
        {upload?.warnings.length ? (
          <ul className="upload-warnings">
            {upload.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="upload-error">{error}</p> : null}
      </div>

      {upload ? (
        <div className="upload-actions">
          {upload.kind === 'icon' && onAdjustCrop ? (
            <button className="btn-clear" onClick={onAdjustCrop} type="button">
              Adjust crop
            </button>
          ) : null}
          <button className="btn-clear" onClick={onClear} type="button">
            Clear
          </button>
        </div>
      ) : null}
    </div>
  )
}
