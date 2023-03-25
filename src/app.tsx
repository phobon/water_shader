import { Box } from './components/box'
import { Canvas } from './components/canvas'
import { ThemeContext } from './design/theme_context'
import { useDetectTheme } from './design/use_detect_theme'

export const App = () => {
  const detectTheme = useDetectTheme()

  return (
    <ThemeContext.Provider value={detectTheme}>
      <Canvas debug>
        <Box />
      </Canvas>
    </ThemeContext.Provider>
  )
}
