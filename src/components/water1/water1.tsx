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

const waves = {
  A: { direction: 0, steepness: 0.01, wavelength: 30 },
  B: { direction: 30, steepness: 0.02, wavelength: 30 },
  C: { direction: 60, steepness: 0.005, wavelength: 30 },
  D: { direction: 90, steepness: 0.015, wavelength: 30 },
}

const Water1Material = shaderMaterial(
  {
    u_depthTexture: null,
    u_displacementTexture: null,
    u_resolution: new THREE.Vector2(0),
    u_cameraNear: 0,
    u_cameraFar: 0,
    u_time: 0,
    u_amplitude: 0.05,
    u_threshold: 0.1,
    u_shallowWaterColor: new THREE.Color(0x146aff),
    u_deepWaterColor: new THREE.Color(0x1f4d9c),
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

extend({ Water1Material })

export const Water1 = forwardRef<any, any>(
  ({ children, args, ...props }, ref) => {
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

    const displacementTexture = useTexture(
      noiseUrl,
      // 'https://i.imgur.com/hOIsXiZ.png',
      (t) => {
        // @ts-ignore
        t.wrapS = t.wrapT = THREE.RepeatWrapping
      }
    )

    const [depthMaterial] = useState(() => {
      const depthMaterial = new THREE.MeshDepthMaterial()
      depthMaterial.depthPacking = THREE.RGBADepthPacking
      depthMaterial.blending = THREE.NoBlending

      return depthMaterial
    })

    useFrame((state) => {
      meshRef.current.visible = false
      state.scene.overrideMaterial = depthMaterial

      state.gl.setRenderTarget(renderTarget)
      state.gl.render(state.scene, state.camera)

      meshRef.current.material.uniforms.u_depthTexture.value =
        renderTarget.depthTexture
      meshRef.current.material.uniforms.u_displacementTexture.value =
        displacementTexture
      meshRef.current.material.uniforms.u_time.value = state.clock.elapsedTime

      state.gl.setRenderTarget(null)

      state.scene.overrideMaterial = null
      meshRef.current.visible = true
    })

    return (
      <mesh ref={meshRef} {...props}>
        <planeGeometry args={args} />
        {/* @ts-ignore */}
        <water1Material side={THREE.DoubleSide} transparent />
      </mesh>
    )
  }
)
