import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { Water } from '../water'
import { SimpleWater } from '../simple_water'
import { StylisedWater } from '../stylised_water'
import { OtherWater } from '../other_water'
import { useFrame } from '@react-three/fiber'

export const WaterScene = () => {
  return (
    <>
      <OrthographicCamera
        makeDefault
        manual
        position={[0, 10, 0]}
        zoom={75}
        near={0}
        far={20}
      />

      <directionalLight position={[0, 5, 15]} intensity={0.8} />
      <ambientLight intensity={0.2} />

      {/* <StylisedWater
        rotation={[-Math.PI / 2, 0, 0]}
        args={[12, 12, 100, 100]}
        bottomDepth={-2}
      /> */}
      <SimpleWater rotation={[-Math.PI / 2, 0, 0]} args={[12, 12, 100, 100]} />

      {/* <OtherWater rotation={[-Math.PI / 2, 0, 0]} args={[12, 12, 100, 100]} /> */}

      <Sphere position={[1, 0, 1]} />
      <Sphere position={[-1, 0, 1]} height={2} />
      <Sphere position={[-1, 0, -1]} height={1.5} />
      <Sphere position={[1, 0, -1]} height={2} />

      <Box
        position={[-6, -0.5, 0]}
        depth={12}
        rotation={[0, 0, Math.PI / 4]}
        width={1}
        height={3}
      />
      <Box
        position={[6, -0.5, 0]}
        depth={12}
        rotation={[0, 0, -Math.PI / 4]}
        width={1}
        height={3}
      />
      <Box
        position={[0, -0.5, 6]}
        depth={12}
        width={1}
        height={3}
        rotation={[0, -Math.PI / 2, -Math.PI / 4]}
      />
      <Box
        position={[0, -0.5, -6]}
        depth={12}
        width={1}
        height={3}
        rotation={[0, -Math.PI / 2, Math.PI / 4]}
      />
      {/* <Box />
      <Box />
      <Box /> */}

      {/* <WaterBottom position={[0, -2, 0]} /> */}
    </>
  )
}

const Box = ({ width = 1, height = 1, depth = 1, ...props }: any) => {
  return (
    <mesh {...props}>
      <boxGeometry args={[width, height, depth]} />
      <meshLambertMaterial color="#adadad" />
    </mesh>
  )
}

const Sphere = ({ height = 1, ...props }: any) => {
  return (
    <mesh {...props}>
      <sphereGeometry args={[height / 2, 32, 32]} />
      <meshLambertMaterial color="#adadad" />
    </mesh>
  )
}

const WaterBottom = (props: any) => {
  return (
    <mesh {...props} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#fff" />
    </mesh>
  )
}
