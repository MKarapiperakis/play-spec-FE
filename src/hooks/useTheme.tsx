import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'playspec-theme'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Tracks the user's light/dark/system preference (persisted in
 * localStorage, defaulting to "system" for a first-time visitor) and keeps
 * the <html> element's "dark" class — see index.html's inline script for
 * the pre-React-paint version of this same logic, which avoids a
 * flash-of-wrong-theme on load — and this context's `resolvedTheme` in
 * sync with it. While "system" is selected, it keeps following live
 * changes to the OS-level preference instead of only reading it once.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(theme))

  useEffect(() => {
    const resolved = resolve(theme)
    applyResolvedTheme(resolved)
    setResolvedTheme(resolved)

    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = media.matches ? 'dark' : 'light'
      applyResolvedTheme(next)
      setResolvedTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
