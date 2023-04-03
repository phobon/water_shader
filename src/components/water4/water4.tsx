import { shaderMaterial, useFBO, useTexture } from '@react-three/drei'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forwardRef, useImperativeHandle, useRef } from 'react'
// @ts-ignore
import noiseUrl from './noise.png'
import { folder, useControls } from 'leva'

const waves = {
  A: { direction: 0, steepness: 0.01, wavelength: 30 },
  B: { direction: 30, steepness: 0.02, wavelength: 30 },
  C: { direction: 60, steepness: 0.005, wavelength: 30 },
  D: { direction: 90, steepness: 0.015, wavelength: 30 },
}

const Water4Material = shaderMaterial(
  {
    u_depthTexture: null,
    u_sceneTexture: null,
    u_noiseTexture: null,

    u_resolution: new THREE.Vector2(0),
    u_cameraNear: 0,
    u_cameraFar: 0,
    u_time: 0,

    u_depth: 9.91,
    u_shallowColor: new THREE.Color(0x146aff).convertLinearToSRGB(),
    u_shallowColorOpacity: 0.48,
    u_deepColor: new THREE.Color(0x1f4d9c).convertLinearToSRGB(),
    u_deepColorOpacity: 0.92,

    u_refractionScale: 50,
    u_refractionSpeed: 0.3,
    u_refractionStrength: 0.0047,

    u_foamColor: new THREE.Color(0xffffff),
    u_foamScale: 35,
    u_foamSpeed: 0.2,
    u_foamAmount: 4.5,
    u_foamCutoff: 5,

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

extend({ Water4Material })

export const Water4 = forwardRef<any, any>(
  ({ children, args, ...props }, ref) => {
    const meshRef = useRef<any>()

    useImperativeHandle(ref, () => meshRef.current)

    const renderTarget = useFBO({
      depth: true,
      // encoding: THREE.sRGBEncoding
    })
    const renderTargetScene = useFBO({
      encoding: THREE.sRGBEncoding,
    })

    useControls('water', {
      depth: {
        value: 9.91,
        min: 0,
        max: 15,
        step: 0.1,
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }

          meshRef.current.material.uniforms.u_depth.value = v
        },
      },
      // shallowColor: {
      //   value: 'rgb(13,49,111)',
      //   onChange: (v) => {
      //     if (!meshRef.current) {
      //       return
      //     }

      //     meshRef.current.material.uniforms.u_shallowColor.value.set(v)
      //   },
      // },
      shallowColorOpacity: {
        value: 0.48,
        min: 0,
        max: 1,
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }

          meshRef.current.material.uniforms.u_shallowColorOpacity.value = v
        },
      },
      deepColorOpacity: {
        value: 0.92,
        min: 0,
        max: 1,
        onChange: (v) => {
          if (!meshRef.current) {
            return
          }

          meshRef.current.material.uniforms.u_deepColorOpacity.value = v
        },
      },
      // deepColor: {
      //   value: 'rgb(0,11,43)',
      //   onChange: (v) => {
      //     if (!meshRef.current) {
      //       return
      //     }

      //     meshRef.current.material.uniforms.u_deepColor.value.set(v)
      //   },
      // },
      refraction: folder({
        scale: {
          value: 50,
          onChange: (v) => {
            if (!meshRef.current) {
              return
            }

            meshRef.current.material.uniforms.u_refractionScale.value = v
          },
        },
        speed: {
          value: 0.3,
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
          value: 0.0024,
          min: 0,
          max: 0.03,
          onChange: (v) => {
            if (!meshRef.current) {
              return
            }

            console.log(v)

            meshRef.current.material.uniforms.u_refractionStrength.value = v
          },
        },
      }),
      foam: folder({
        foamScale: {
          value: 35,
          onChange: (v) => {
            if (!meshRef.current) {
              return
            }

            meshRef.current.material.uniforms.u_foamScale.value = v
          },
        },
        foamSpeed: {
          value: 0.2,
          min: 0,
          max: 2,
          onChange: (v) => {
            if (!meshRef.current) {
              return
            }

            meshRef.current.material.uniforms.u_foamSpeed.value = v
          },
        },
        foamAmount: {
          value: 4.5,
          min: 0,
          max: 30,
          onChange: (v) => {
            if (!meshRef.current) {
              return
            }

            meshRef.current.material.uniforms.u_foamAmount.value = v
          },
        },
        foamCutoff: {
          value: 5,
          min: 0,
          max: 10,
          onChange: (v) => {
            if (!meshRef.current) {
              return
            }

            meshRef.current.material.uniforms.u_foamCutoff.value = v
          },
        },
      }),
    })

    useFrame((state) => {
      const { gl, scene, camera, clock, size } = state
      meshRef.current.material.uniforms.u_cameraNear.value = camera.near
      meshRef.current.material.uniforms.u_cameraFar.value = camera.far
      meshRef.current.material.uniforms.u_time.value = clock.elapsedTime

      meshRef.current.material.uniforms.u_resolution.value.x =
        size.width * window.devicePixelRatio
      meshRef.current.material.uniforms.u_resolution.value.y =
        size.height * window.devicePixelRatio

      gl.setRenderTarget(renderTarget)
      gl.render(scene, camera)

      meshRef.current.material.uniforms.u_depthTexture.value =
        renderTarget.depthTexture

      gl.setRenderTarget(null)

      gl.setRenderTarget(renderTargetScene)
      gl.render(scene, camera)

      meshRef.current.material.uniforms.u_sceneTexture.value =
        renderTargetScene.texture

      gl.setRenderTarget(null)
    })

    return (
      <>
        {/* <mesh {...props} position={[0, 1, 0]}>
          <planeGeometry args={args} />
          <meshBasicMaterial
            side={THREE.DoubleSide}
            transparent
            color={0x146aff}
          />
        </mesh> */}

        <mesh ref={meshRef} {...props}>
          <planeGeometry args={args} />
          {/* @ts-ignore */}
          <water4Material side={THREE.DoubleSide} transparent />
        </mesh>
      </>
    )
  }
)
