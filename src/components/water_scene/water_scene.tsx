import { OrthographicCamera, shaderMaterial, useFBO } from '@react-three/drei'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { forwardRef, useEffect, useRef } from 'react'
import * as THREE from 'three'

export const WaterScene = () => {
  const renderTarget = useFBO({ depth: true })
  const cameraRef = useRef<any>()
  const waterRef = useRef<any>()
  const sceneRef = useRef<any>()
  const textureRef = useRef<any>()

  const size = useThree((state) => state.size)

  useEffect(() => {
    textureRef.current.material.uniforms.u_resolution.value.x = size.width
    textureRef.current.material.uniforms.u_resolution.value.y = size.height
  }, [size])

  useFrame((state) => {
    const { gl, clock, scene, camera } = state

    waterRef.current.visible = false

    gl.setRenderTarget(renderTarget)

    gl.render(sceneRef.current, camera)

    textureRef.current.material.uniforms.u_depthTexture.value =
      renderTarget.depthTexture

    gl.setRenderTarget(null)

    waterRef.current.visible = true
  })

  return (
    <>
      <OrthographicCamera position={[0, 10, 10]} zoom={75} />
      <OrthographicCamera makeDefault manual position={[0, 10, 0]} zoom={75} />

      <scene ref={sceneRef}>
        <Water ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} />

        <Box position={[1, 0, 1]} />
        <Box position={[-1, 0, 1]} />
        <Box position={[-1, 0, -1]} />
        <Box position={[1, 0, -1]} />
      </scene>

      <mesh
        ref={textureRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[10, 0, 0]}
      >
        <planeGeometry args={[10, 10]} />
        {/* @ts-ignore */}
        <waterMaterial />
      </mesh>
    </>
  )
}

const WaterMaterial = shaderMaterial(
  {
    u_depthTexture: null,
    u_resolution: new THREE.Vector2(0),
  },
  `varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  `varying vec2 v_uv;
  uniform sampler2D u_depthTexture;
  uniform vec2 u_resolution;
  void main() {
    float aspectRatio = u_resolution.x / u_resolution.y;
    vec2 aspectCorrectedUv = v_uv / vec2(aspectRatio, 1.0);
    vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;
    float depth = 1.0 - texture2D(u_depthTexture, screenUv).x;
    gl_FragColor = texture2D(u_depthTexture, aspectCorrectedUv);
    // gl_FragColor = vec4(vec3(depth), 1.0);
  }`
)

extend({ WaterMaterial })

const Water = forwardRef((props: any, ref) => {
  return (
    <mesh {...props} ref={ref}>
      <planeGeometry args={[10, 10]} />
      {/* @ts-ignore */}
      {/* <waterMaterial /> */}
      <meshBasicMaterial color="blue" />
    </mesh>
  )
})

const Box = (props: any) => {
  return (
    <mesh {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="orange" />
    </mesh>
  )
}
