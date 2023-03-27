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
        near={0.1}
        far={17}
      />

      <directionalLight position={[0, 10, 10]} intensity={1.0} />
      <ambientLight intensity={0.3} />

      <StylisedWater
        rotation={[-Math.PI / 2, 0, 0]}
        args={[10, 10, 100, 100]}
      />

      <Box position={[1, 0, 1]} />
      <Box position={[-1, 0, 1]} height={2} />
      <Box position={[-1, 0, -1]} height={1.5} />
      <Box position={[1, 0, -1]} height={3} />

      <WaterBottom position={[0, -2, 0]} />
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

const WaterBottom = (props: any) => {
  return (
    <mesh {...props} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="brown" />
    </mesh>
  )
}
