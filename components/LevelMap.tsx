import React from 'react';
import * as THREE from 'three';
import { MapTheme } from '../types';

interface LevelMapProps {
  theme: MapTheme;
}

export const LevelMap: React.FC<LevelMapProps> = ({ theme }) => {
  return (
    <group>
      {theme === 'default' && <DefaultMap />}
      {theme === 'spaceship' && <SpaceshipMap />}
      {theme === 'forest' && <ForestMap />}
    </group>
  );
};

// --- DEFAULT MAP (Warehouse/Industrial) ---
const DefaultMap = () => (
  <>
    {/* Floor */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ type: 'floor' }}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#d6d3d1" /> {/* Stone-300 */}
    </mesh>
    <gridHelper args={[100, 50, 0x444444, 0x555555]} position={[0, 0.01, 0]} />

    {/* Crates */}
    <Crate position={[5, 1, 5]} color="#b45309" />
    <Crate position={[-5, 1, 8]} color="#b45309" />
    <Crate position={[10, 1, -10]} rotation={[0, 0.5, 0]} color="#b45309" />
    <Crate position={[-8, 1, -5]} color="#b45309" />
    <Crate position={[3, 1, -15]} size={[2, 2, 2]} color="#b45309" />
    <Crate position={[-10, 1, 10]} color="#b45309" />
    <Crate position={[-10, 3, 10]} color="#b45309" />

    {/* Walls */}
    <Wall position={[0, 2.5, -25]} size={[50, 5, 1]} color="#475569" />
    <Wall position={[0, 2.5, 25]} size={[50, 5, 1]} color="#475569" />
    <Wall position={[-25, 2.5, 0]} size={[1, 5, 50]} color="#475569" />
    <Wall position={[25, 2.5, 0]} size={[1, 5, 50]} color="#475569" />
  </>
);

// --- SPACESHIP MAP (Sci-fi) ---
const SpaceshipMap = () => (
  <>
    {/* Floor - Dark Metal */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ type: 'floor' }}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} /> 
    </mesh>
    <gridHelper args={[100, 50, 0x0ea5e9, 0x0f172a]} position={[0, 0.01, 0]} />

    {/* Sci-fi Crates */}
    <Crate position={[5, 1, 5]} color="#334155" metalness={0.9} />
    <Crate position={[-5, 1, 8]} color="#334155" metalness={0.9} />
    <Crate position={[12, 1, -8]} size={[3, 2, 3]} color="#1e293b" metalness={0.9} />
    
    {/* Central Pillar */}
    <Wall position={[0, 5, 0]} size={[2, 10, 2]} color="#0ea5e9" />

    {/* Walls with Neon Strips */}
    <Wall position={[0, 3, -25]} size={[50, 6, 1]} color="#1e293b" />
    <Wall position={[0, 3, 25]} size={[50, 6, 1]} color="#1e293b" />
    <Wall position={[-25, 3, 0]} size={[1, 6, 50]} color="#1e293b" />
    <Wall position={[25, 3, 0]} size={[1, 6, 50]} color="#1e293b" />
  </>
);

// --- FOREST MAP (Nature) ---
const ForestMap = () => (
  <>
    {/* Floor - Grass */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ type: 'floor' }}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#4d7c0f" roughness={1} /> 
    </mesh>

    {/* Trees (Trunk + Leaves) */}
    <Tree position={[5, 0, 5]} />
    <Tree position={[-8, 0, 10]} />
    <Tree position={[15, 0, -12]} scale={1.5} />
    <Tree position={[-15, 0, -5]} />
    <Tree position={[8, 0, -20]} />
    <Tree position={[-5, 0, -15]} scale={1.2} />

    {/* Rocks */}
    <Crate position={[2, 0.5, 8]} size={[1.5, 1, 1.5]} color="#57534e" rotation={[0.2, 0.5, 0.1]} />
    <Crate position={[-12, 1, -2]} size={[3, 2, 3]} color="#57534e" rotation={[0, 0.2, 0]} />

    {/* Boundary (Dense Trees simplified as walls for collision) */}
    <Wall position={[0, 5, -25]} size={[50, 10, 1]} color="#14532d" />
    <Wall position={[0, 5, 25]} size={[50, 10, 1]} color="#14532d" />
    <Wall position={[-25, 5, 0]} size={[1, 10, 50]} color="#14532d" />
    <Wall position={[25, 5, 0]} size={[1, 10, 50]} color="#14532d" />
  </>
);

// --- REUSABLE COMPONENTS ---

const Crate = ({ 
  position, 
  size = [2, 2, 2], 
  rotation = [0, 0, 0], 
  color = "#b45309",
  metalness = 0 
}: { 
  position: [number, number, number], 
  size?: [number, number, number], 
  rotation?: [number, number, number],
  color?: string,
  metalness?: number
}) => (
  <mesh position={position} rotation={rotation as any} castShadow receiveShadow userData={{ type: 'wall' }}>
    <boxGeometry args={size as any} />
    <meshStandardMaterial color={color} metalness={metalness} />
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(size[0], size[1], size[2])]} />
      <lineBasicMaterial color="black" linewidth={2} transparent opacity={0.2} />
    </lineSegments>
  </mesh>
);

const Wall = ({ position, size, color }: { position: [number, number, number], size: [number, number, number], color: string }) => (
  <mesh position={position} receiveShadow userData={{ type: 'wall' }}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} />
  </mesh>
);

const Tree = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => (
  <group position={position} scale={[scale, scale, scale]} userData={{ type: 'wall' }}>
    {/* Trunk - Collision Box */}
    <mesh position={[0, 1, 0]} castShadow receiveShadow userData={{ type: 'wall' }}>
      <boxGeometry args={[0.6, 2, 0.6]} />
      <meshStandardMaterial color="#3f2e3e" />
    </mesh>
    {/* Leaves */}
    <mesh position={[0, 3, 0]} castShadow receiveShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#15803d" />
    </mesh>
    <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.2, 1.5, 1.2]} />
      <meshStandardMaterial color="#16a34a" />
    </mesh>
  </group>
);
