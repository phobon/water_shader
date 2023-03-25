import { useContext } from 'react'
import { Dispatch, SetStateAction, createContext } from 'react'

export type ThemeType = 'light' | 'dark'

export type UserTheme = {
  currentTheme: ThemeType
  overrideSystemOnMediaQueryChange?: boolean
}

export type ThemeContextType = [
  theme: UserTheme,
  setTheme: Dispatch<SetStateAction<UserTheme>> | undefined
]

export const ThemeContext = createContext<ThemeContextType>([
  {
    currentTheme: 'dark',
    overrideSystemOnMediaQueryChange: false,
  },
  undefined,
])

export const useTheme = () => useContext(ThemeContext)
