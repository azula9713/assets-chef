import { useEffect, useId, useState } from 'react'

type TextFieldProps = {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

export function TextField({
  label,
  onChange,
  placeholder,
  value,
}: TextFieldProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <label className="field text-field" htmlFor={inputId}>
      <div className="field-label">{label}</div>

      <input
        className="text-input"
        id={inputId}
        maxLength={64}
        onBlur={() => onChange(draft)}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        type="text"
        value={draft}
      />
    </label>
  )
}
