import { useId, useState, type ChangeEvent, type DragEvent } from 'react'

import type { ValidatedUpload } from '../lib/types'

type UploadCardProps = {
  error?: string
  onClear: () => void
  onFileSelected: (file: File) => void
  required?: boolean
  title: string
  upload?: ValidatedUpload
}

export function UploadCard({
  error,
  onClear,
  onFileSelected,
  required,
  title,
  upload,
}: Readonly<UploadCardProps>) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files.item(0)

    if (file) {
      onFileSelected(file)
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.item(0)

    if (file) {
      onFileSelected(file)
    }

    event.target.value = ''
  }

  return (
    <article className="upload-card card">
      <div className="upload-card-main">
        <div className="upload-card-head">
          <div className="upload-card-title">
            {title}{required && <span className="required-mark" aria-hidden="true"> *</span>}
          </div>
        </div>

        <div className="upload-card-body">
          <label
          className={`dropzone ${isDragging ? 'dragging' : ''} ${upload ? 'filled' : ''}`}
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

          {upload ? (
            <div className="upload-preview">
              <img
                alt={`${title} preview`}
                className="upload-thumb"
                height={32}
                src={upload.url}
                width={32}
              />
              <div className="upload-meta">
                <strong>{upload.file.name}</strong>
                <span>
                  {upload.width}×{upload.height}
                </span>
                <span>{upload.file.type || 'image file'}</span>
              </div>
            </div>
          ) : (
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
          )}
        </label>
        </div>
      </div>

      {(upload?.warnings.length || error || upload) ? (
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
            <button className="btn-clear" onClick={onClear} type="button">
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
