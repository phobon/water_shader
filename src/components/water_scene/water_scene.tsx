import { OrthographicCamera, shaderMaterial, useFBO } from '@react-three/drei'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { forwardRef, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Water } from '../water/water'

export const WaterScene = () => {
  return (
    <>
      <OrthographicCamera makeDefault manual position={[0, 10, 0]} zoom={75} />

      <directionalLight position={[0, 10, 10]} intensity={1.0} />
      <ambientLight intensity={0.3} />

      <Water rotation={[-Math.PI / 2, 0, 0]} args={[10, 10, 100, 100]} />

      <Box position={[1, 0, 1]} />
      <Box position={[-1, 0, 1]} />
      <Box position={[-1, 0, -1]} />
      <Box position={[1, 0, -1]} />
    </>
  )
}

const Box = (props: any) => {
  return (
    <mesh {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial color="#adadad" />
    </mesh>
  )
}
