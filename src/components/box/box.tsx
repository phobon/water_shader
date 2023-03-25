import { useFrame, extend } from '@react-three/fiber'
import { useRef } from 'react'
import { shaderMaterial } from '@react-three/drei'

import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'
import { useControls } from 'leva'

const BlueChannelMaterial = shaderMaterial(
  {
    u_time: 0,
  },
  vertexShader,
  fragmentShader
)

extend({ BlueChannelMaterial })

export const Box = () => {
  const meshRef = useRef<any>()

  const { rotationX, rotationY } = useControls({
    rotationX: {
      min: 0,
      max: 0.1,
      step: 0.001,
      value: 0.005,
    },
    rotationY: {
      min: 0,
      max: 0.1,
      step: 0.001,
      value: 0.005,
    },
  })

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) {
      return
    }

    mesh.material.uniforms.u_time.value = clock.elapsedTime

    mesh.rotation.x += rotationX
    mesh.rotation.y += rotationY
  })

  return (
    <mesh position={[0, 0, 0]} ref={meshRef} scale={[250, 250, 250]}>
      <boxGeometry args={[1, 1, 1]} />
      {/* @ts-ignore */}
      <blueChannelMaterial />
    </mesh>
  )
}
