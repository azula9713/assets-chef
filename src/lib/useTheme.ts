import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'assets-chef-theme'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  // Remove transition suppression added by the inline script after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.documentElement.classList.remove('no-transition')
      )
    )
    return () => cancelAnimationFrame(id)
  }, [])

  return { theme, setTheme: setThemeState }
}
