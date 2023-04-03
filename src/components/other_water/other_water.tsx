import { shaderMaterial, useFBO, useTexture } from '@react-three/drei'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'
import { createPortal, extend, useFrame, useThree } from '@react-three/fiber'
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
import { useControls, folder } from 'leva'

const waves = {
  A: { direction: 0, steepness: 0.01, wavelength: 30 },
  B: { direction: 30, steepness: 0.02, wavelength: 30 },
  C: { direction: 60, steepness: 0.005, wavelength: 30 },
  D: { direction: 90, steepness: 0.015, wavelength: 30 },
}

const OtherWaterMaterial = shaderMaterial(
  {
    u_depthTexture: null,
    u_sceneTexture: null,
    u_displacementTexture: null,
    u_resolution: new THREE.Vector2(0),
    u_cameraNear: 0,
    u_cameraFar: 0,
    u_depth: 0,
    u_time: 0,
    u_amplitude: 0.05,
    u_threshold: 0.1,

    // Water colors
    u_shallowWaterColor: new THREE.Color(0x146aff),
    u_shallowWaterOpacity: 0.5,
    u_deepWaterColor: new THREE.Color(0x1f4d9c),
    u_deepWaterOpacity: 0.9,
    u_foamColor: new THREE.Color(0xffffff),
    u_foamOpacity: 1,
    u_waterOpacity: 0.5,

    // Refraction
    u_refractionScale: 1,
    u_refractionSpeed: 0.1,
    u_refractionStrength: 0.1,

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

extend({ OtherWaterMaterial: OtherWaterMaterial })

export const OtherWater = forwardRef<any, any>(({ args, ...props }, ref) => {
  const meshRef = useRef<any>()

  useImperativeHandle(ref, () => meshRef.current)

  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useEffect(() => {
    meshRef.current.material.uniforms.u_cameraNear.value = camera.near
    meshRef.current.material.uniforms.u_cameraFar.value = camera.far
  }, [camera])

  useEffect(() => {
    meshRef.current.material.uniforms.u_resolution.value.x =
      size.width * window.devicePixelRatio
    meshRef.current.material.uniforms.u_resolution.value.y =
      size.height * window.devicePixelRatio
  }, [size])

  const renderTarget = useFBO({ depth: true })
  const renderTargetScene = useFBO()

  const displacementTexture = useTexture(noiseUrl, (t) => {
    // @ts-ignore
    t.wrapS = t.wrapT = THREE.RepeatWrapping
  })

  useControls('water', {
    depth: {
      value: 1,
      min: 0,
      max: 20,
      step: 0.1,
      onChange: (v) => {
        if (!meshRef.current) {
          return
        }
        meshRef.current.material.uniforms.u_depth.value = v
      },
    },
    opacity: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
      onChange: (v) => {
        if (!meshRef.current) {
          return
        }
        meshRef.current.material.uniforms.u_waterOpacity.value = v
      },
    },
    refractedUv: folder({
      scale: {
        value: 87.3,
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }
          meshRef.current.material.uniforms.u_refractionScale.value = v
        },
      },
      speed: {
        value: 0.7,
        min: 0,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }
          meshRef.current.material.uniforms.u_refractionSpeed.value = v
        },
      },
      strength: {
        value: 0.0047,
        min: 0,
        max: 0.03,
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }
          meshRef.current.material.uniforms.u_refractionStrength.value = v
        },
      },
    }),
    colors: folder({
      shallowWaterColor: {
        value: 'rgb(13,49,111)',
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }
          meshRef.current.material.uniforms.u_shallowWaterColor.value.set(v)
        },
      },
      shallowWaterOpacity: {
        value: 0.48,
        min: 0,
        max: 1,
        step: 0.1,
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }
          meshRef.current.material.uniforms.u_shallowWaterOpacity.value = v
        },
      },
      deepWaterColor: {
        value: 'rgb(0,11,43)',
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }
          meshRef.current.material.uniforms.u_deepWaterColor.value.set(v)
        },
      },
      deepWaterOpacity: {
        value: 0.9,
        min: 0,
        max: 1,
        step: 0.1,
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }
          meshRef.current.material.uniforms.u_deepWaterOpacity.value = v
        },
      },
    }),
  })

  useFrame((state) => {
    meshRef.current.material.uniforms.u_displacementTexture.value =
      displacementTexture
    meshRef.current.material.uniforms.u_time.value = state.clock.elapsedTime

    state.gl.setRenderTarget(renderTarget)
    state.gl.render(state.scene, state.camera)

    meshRef.current.material.uniforms.u_depthTexture.value =
      renderTarget.depthTexture

    state.gl.setRenderTarget(null)

    state.gl.setRenderTarget(renderTargetScene)
    state.gl.render(state.scene, state.camera)

    meshRef.current.material.uniforms.u_sceneTexture.value =
      renderTarget.texture

    state.gl.setRenderTarget(null)
  })

  return (
    <mesh ref={meshRef} {...props}>
      <planeGeometry args={args} />
      {/* @ts-ignore */}
      <simpleWaterMaterial side={THREE.DoubleSide} transparent />
    </mesh>
  )
})
