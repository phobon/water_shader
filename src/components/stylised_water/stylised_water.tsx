import { shaderMaterial, useFBO, useTexture } from '@react-three/drei'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'
import { extend, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
// @ts-ignore
import noiseUrl from './noise.png'
import { useControls } from 'leva'

const waves = {
  A: { direction: 0, steepness: 0.01, wavelength: 30 },
  B: { direction: 30, steepness: 0.02, wavelength: 30 },
  C: { direction: 60, steepness: 0.005, wavelength: 30 },
  D: { direction: 90, steepness: 0.015, wavelength: 30 },
}

const WaterMaterial = shaderMaterial(
  {
    u_sceneTexture: null,
    u_depthTexture: null,
    u_displacementTexture: null,
    u_resolution: new THREE.Vector2(0),
    u_cameraNear: 0,
    u_cameraFar: 0,
    u_cameraPosition: new THREE.Vector3(0),
    u_time: 0,
    u_amplitude: 0.05,
    u_threshold: 0.1,
    u_waterColor: new THREE.Color(0x146aff),
    u_underWaterColor: new THREE.Color(0x1f4d9c),
    u_foamColor: new THREE.Color(0xffffff),
    u_waveA: new THREE.Vector4(
      Math.sin((waves.A.direction * Math.PI) / 180),
      Math.cos((waves.A.direction * Math.PI) / 180),
      waves.A.steepness,
      waves.A.wavelength
    ),
    u_waveB: new THREE.Vector4(
      Math.sin((waves.B.direction * Math.PI) / 180),
      Math.cos((waves.B.direction * Math.PI) / 180),
      waves.B.steepness,
      waves.B.wavelength
    ),
    u_waveC: new THREE.Vector4(
      Math.sin((waves.C.direction * Math.PI) / 180),
      Math.cos((waves.C.direction * Math.PI) / 180),
      waves.C.steepness,
      waves.C.wavelength
    ),
    u_waveD: new THREE.Vector4(
      Math.sin((waves.D.direction * Math.PI) / 180),
      Math.cos((waves.D.direction * Math.PI) / 180),
      waves.D.steepness,
      waves.D.wavelength
    ),
  },
  vertexShader,
  fragmentShader
)

extend({ WaterMaterial })

export const StylisedWater = forwardRef<any, any>(
  ({ children, args, ...props }, ref) => {
    const meshRef = useRef<any>()

    useImperativeHandle(ref, () => meshRef.current)

    const defaultCamera = useThree((state) => state.camera)
    const size = useThree((state) => state.size)

    useEffect(() => {
      meshRef.current.material.uniforms.u_cameraPosition.value =
        defaultCamera.position
      meshRef.current.material.uniforms.u_cameraNear.value = defaultCamera.near
      meshRef.current.material.uniforms.u_cameraFar.value = defaultCamera.far
    }, [defaultCamera])

    useEffect(() => {
      meshRef.current.material.uniforms.u_resolution.value.x =
        size.width * window.devicePixelRatio
      meshRef.current.material.uniforms.u_resolution.value.y =
        size.height * window.devicePixelRatio
    }, [size])

    const renderTarget = useFBO({ depth: true })
    const renderTargetScene = useFBO()

    const displacementTexture = useTexture(
      noiseUrl,
      // 'https://i.imgur.com/hOIsXiZ.png',
      (t) => {
        // @ts-ignore
        t.wrapS = t.wrapT = THREE.RepeatWrapping
      }
    )

    useFrame((state) => {
      const { gl, scene, camera, clock } = state

      gl.setRenderTarget(renderTarget)
      gl.render(scene, camera)

      meshRef.current.material.uniforms.u_depthTexture.value =
        renderTarget.depthTexture

      gl.setRenderTarget(null)

      // Render the scene texture without water
      meshRef.current.visible = false

      gl.setRenderTarget(renderTargetScene)
      gl.render(scene, camera)

      meshRef.current.material.uniforms.u_sceneTexture.value =
        renderTargetScene.texture

      gl.setRenderTarget(null)

      meshRef.current.visible = true

      meshRef.current.material.uniforms.u_displacementTexture.value =
        displacementTexture
      meshRef.current.material.uniforms.u_time.value = clock.elapsedTime
    })

    return (
      <mesh ref={meshRef} {...props}>
        <planeGeometry args={args} />
        {/* @ts-ignore */}
        <waterMaterial side={THREE.DoubleSide} transparent />
      </mesh>
    )
  }
)
