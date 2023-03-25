import { useContext } from 'react'

import { ThemeContext } from './theme_context'

export const useCurrentTheme = () => {
  const [{ currentTheme }] = useContext(ThemeContext)
  return currentTheme
}
