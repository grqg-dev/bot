import { Canvas } from '@react-three/fiber';
import { Robot } from '../avatar/Robot';

interface RobotSceneProps {
  className?: string;
}

export function RobotScene({ className = '' }: RobotSceneProps) {
  return (
    <div className={`robot-scene ${className}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.5, 3.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} />
        <Robot />
      </Canvas>
    </div>
  );
}
