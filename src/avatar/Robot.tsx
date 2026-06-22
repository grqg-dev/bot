import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { useRobotFaceTexture } from './RobotFace';

const COLOR_MAP: Record<string, string> = {
  c1: '#6bb5e0',
  c2: '#e88baa',
  c3: '#8ed48e',
};

const EYE_STYLE: Record<string, string> = {
  eyes1: '#1a1a2e',
  eyes2: '#4a90d9',
};

export function Robot({ scale = 1 }: { scale?: number }) {
  const avatarState = useStore((s) => s.avatarState);
  const equipped = useStore((s) => s.progress.equipped);
  const groupRef = useRef<THREE.Group>(null);
  const talkPhaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.05;
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.08;

    if (avatarState === 'talking') {
      talkPhaseRef.current += delta * 6 * Math.PI * 2;
    }
  });

  const talkPhase = avatarState === 'talking' ? talkPhaseRef.current : 0;
  const faceTexture = useRobotFaceTexture(avatarState, talkPhase);

  const colorId = equipped.color ?? 'c1';
  const antennaId = equipped.antenna ?? 'a1';
  const eyesId = equipped.eyes ?? 'eyes1';
  const stickerId = equipped.sticker;

  const bodyColor = COLOR_MAP[colorId] ?? '#6bb5e0';
  const eyeColor = EYE_STYLE[eyesId] ?? '#1a1a2e';
  const hasBallAntenna = antennaId === 'a2';

  return (
    <group ref={groupRef} scale={scale}>
      {/* Body */}
      <RoundedBox args={[1.2, 1.4, 0.7]} radius={0.15} smoothness={4} position={[0, -0.3, 0]}>
        <meshStandardMaterial color={bodyColor} />
      </RoundedBox>

      {/* Head */}
      <RoundedBox args={[1, 1, 0.8]} radius={0.12} smoothness={4} position={[0, 0.7, 0]}>
        <meshStandardMaterial color={bodyColor} />
      </RoundedBox>

      {/* Face screen */}
      <mesh position={[0, 0.7, 0.41]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial map={faceTexture} toneMapped={false} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.85, -0.1, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.08, 0.08, 0.7, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.85, -0.1, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.08, 0.08, 0.7, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      {hasBallAntenna ? (
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#ffdd57" emissive="#ffdd57" emissiveIntensity={0.3} />
        </mesh>
      ) : (
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
      )}

      {/* Sticker */}
      {stickerId === 'st1' && (
        <mesh position={[0.35, -0.5, 0.36]} rotation={[0, 0, -0.2]}>
          <circleGeometry args={[0.12, 16]} />
          <meshStandardMaterial color="#ff6b9d" />
        </mesh>
      )}
      {stickerId === 'st2' && (
        <mesh position={[-0.35, -0.5, 0.36]} rotation={[0, 0, 0.2]} geometry={starGeometry()}>
          <meshStandardMaterial color="#ffd700" />
        </mesh>
      )}

      {/* Eye color accent rings (for eyes2 part) */}
      {eyesId === 'eyes2' && (
        <>
          <mesh position={[-0.15, 0.78, 0.42]}>
            <ringGeometry args={[0.06, 0.09, 16]} />
            <meshBasicMaterial color={eyeColor} />
          </mesh>
          <mesh position={[0.15, 0.78, 0.42]}>
            <ringGeometry args={[0.06, 0.09, 16]} />
            <meshBasicMaterial color={eyeColor} />
          </mesh>
        </>
      )}
    </group>
  );
}

function starGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const outer = 0.12;
  const inner = 0.05;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}
