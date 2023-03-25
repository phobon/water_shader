import { OrbitControls, Preload } from '@react-three/drei'
import { Canvas as ThreeCanvas } from '@react-three/fiber'
import { useControls } from 'leva'
import { Suspense } from 'react'
import { Debug } from '../debug'
import { ScreenSizeCamera } from '../screen_size_camera'

export const Canvas = ({
  debug = true,
  frameloop = 'always',
  children,
  ...props
}: any) => {
  const { debug: showDebug, controls } = useControls('debug', {
    debug,
    controls: true,
  })

  return (
    <ThreeCanvas frameloop={frameloop} {...props}>
      <Preload all />

      <Suspense fallback={null}>{children}</Suspense>

      {controls ? <OrbitControls /> : null}
      {showDebug ? <Debug /> : null}

      <ScreenSizeCamera makeDefault />
    </ThreeCanvas>
  )
}
