import { useEffect, useId, useState } from 'react'

type ColorFieldProps = {
  label: string
  onChange: (value: string) => void
  value: string
}

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

function cleanHex(value: string) {
  const sanitized = value.replace(/[^0-9a-fA-F#]/g, '')
  return sanitized.startsWith('#') ? sanitized.slice(0, 7) : `#${sanitized.slice(0, 6)}`
}

export function ColorField({
  label,
  onChange,
  value,
}: ColorFieldProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const normalizedDraft = cleanHex(draft)
  const isInvalid = normalizedDraft.length > 1 && !HEX_COLOR_PATTERN.test(normalizedDraft)

  function commit() {
    if (HEX_COLOR_PATTERN.test(normalizedDraft)) {
      const next = normalizedDraft.toUpperCase()
      setDraft(next)
      onChange(next)
      return
    }

    setDraft(value)
  }

  return (
    <label className="field color-field" htmlFor={inputId}>
      <div className="field-label">{label}</div>

      <div className="color-controls">
        <input
          className="color-swatch"
          id={inputId}
          onChange={(event) => {
            const next = event.target.value.toUpperCase()
            setDraft(next)
            onChange(next)
          }}
          type="color"
          value={value}
        />

        <input
          className={`color-text ${isInvalid ? 'invalid' : ''}`}
          inputMode="text"
          maxLength={7}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="#FFFFFF"
          spellCheck={false}
          type="text"
          value={draft}
        />
      </div>

      {isInvalid && (
        <p className="helper-text error">Use a full 6-digit hex like #0E7490.</p>
      )}
    </label>
  )
}
