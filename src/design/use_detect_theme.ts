import { ThemeContextType, ThemeType, UserTheme } from './theme_context'
import { useEffect } from 'react'
import { usePersistedState } from '../utils/use_persisted_state'

export const PREFERS_COLOR_SCHEME_KEY = '(prefers-color-scheme: dark)'

const handleMediaMatched = (previousTheme: UserTheme, newTheme: ThemeType) => {
  const { overrideSystemOnMediaQueryChange } = previousTheme
  if (!overrideSystemOnMediaQueryChange) {
    return { currentTheme: newTheme, overrideSystemOnMediaQueryChange }
  }

  return previousTheme
}

export const useDetectTheme = (): ThemeContextType => {
  const [theme, setTheme] = usePersistedState<UserTheme>('watershader__theme', {
    currentTheme: 'dark',
    overrideSystemOnMediaQueryChange: false,
  })

  useEffect(() => {
    if (!window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia(PREFERS_COLOR_SCHEME_KEY)

    const onMediaMatched = (e: MediaQueryListEvent) =>
      setTheme((previousTheme: UserTheme) =>
        handleMediaMatched(previousTheme, e.matches ? 'dark' : 'light')
      )

    mediaQuery.addEventListener('change', onMediaMatched)

    return () => {
      mediaQuery.removeEventListener('change', onMediaMatched)
    }
  }, [setTheme])

  // Set an attribute on the document to represent the current theme
  useEffect(() => {
    const { overrideSystemOnMediaQueryChange, currentTheme } = theme

    // If we're not overriding the theme here, remove the attribute
    if (!overrideSystemOnMediaQueryChange) {
      document.documentElement.removeAttribute('data-theme')
    } else {
      // Otherwise, set the theme attribute
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
  }, [theme])

  return [theme, setTheme]
}
