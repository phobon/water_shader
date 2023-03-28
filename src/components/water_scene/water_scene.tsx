import { OrthographicCamera } from '@react-three/drei'
import { Water } from '../water'
import { StylisedWater } from '../stylised_water'

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

      <StylisedWater
        rotation={[-Math.PI / 2, 0, 0]}
        args={[12, 12, 100, 100]}
        bottomDepth={-2}
      />

      <Sphere position={[1, 0, 1]} />
      <Sphere position={[-1, 0, 1]} height={2} />
      <Sphere position={[-1, 0, -1]} height={1.5} />
      <Sphere position={[1, 0, -1]} height={2} />

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
      <meshStandardMaterial color="black" />
    </mesh>
  )
}
