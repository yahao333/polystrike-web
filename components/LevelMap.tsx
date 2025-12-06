import React from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export const LevelMap: React.FC = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ type: 'floor' }}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#d6d3d1" /> {/* Stone-300 */}
      </mesh>

      {/* Grid Pattern on Floor for visual reference */}
      <gridHelper args={[100, 50, 0x444444, 0x555555]} position={[0, 0.01, 0]} />

      {/* Random Crates for cover */}
      <Crate position={[5, 1, 5]} />
      <Crate position={[-5, 1, 8]} />
      <Crate position={[10, 1, -10]} rotation={[0, 0.5, 0]} />
      <Crate position={[-8, 1, -5]} />
      <Crate position={[3, 1, -15]} size={[2, 2, 2]} />
      
      {/* Stacked Crates */}
      <Crate position={[-10, 1, 10]} />
      <Crate position={[-10, 3, 10]} />

      {/* Walls */}
      <Wall position={[0, 2.5, -25]} size={[50, 5, 1]} />
      <Wall position={[0, 2.5, 25]} size={[50, 5, 1]} />
      <Wall position={[-25, 2.5, 0]} size={[1, 5, 50]} />
      <Wall position={[25, 2.5, 0]} size={[1, 5, 50]} />
    </group>
  );
};

const Crate = ({ position, size = [2, 2, 2], rotation = [0, 0, 0] }: { position: [number, number, number], size?: [number, number, number], rotation?: [number, number, number] }) => (
  <mesh position={position} rotation={rotation as any} castShadow receiveShadow userData={{ type: 'wall' }}>
    <boxGeometry args={size as any} />
    <meshStandardMaterial color="#b45309" /> {/* Amber-700 */}
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(size[0], size[1], size[2])]} />
      <lineBasicMaterial color="black" linewidth={2} />
    </lineSegments>
  </mesh>
);

const Wall = ({ position, size }: { position: [number, number, number], size: [number, number, number] }) => (
  <mesh position={position} receiveShadow userData={{ type: 'wall' }}>
    <boxGeometry args={size} />
    <meshStandardMaterial color="#475569" /> {/* Slate-600 */}
  </mesh>
);