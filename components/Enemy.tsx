import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { EnemyData } from '../types';

// Define materials once to share across all enemy instances for performance
const materials = {
  skin: new THREE.MeshStandardMaterial({ color: '#fca5a5', roughness: 0.5 }), // Light pinkish
  shirt: new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.8 }), // Dark Red (Terrorist)
  pants: new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.8 }), // Dark Grey
  gun: new THREE.MeshStandardMaterial({ color: '#111827', metalness: 0.5, roughness: 0.5 }), // Black metal
};

interface EnemyProps {
  data: EnemyData;
}

export const Enemy: React.FC<EnemyProps> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Refs for individual body parts to animate them
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);

  const { camera, scene } = useThree();
  const isDead = data.status === 'dead';

  // Shared hit data for raycasting so clicking any part damages the enemy
  const hitData = { type: 'enemy', id: data.id };

  const checkCollision = (newPos: THREE.Vector3) => {
    const enemyRadius = 0.4;
    const enemyBox = new THREE.Box3();
    // Assuming enemy pivot is at Y=1 (center of height) or Y=0 (feet)
    // In GameScene, they are spawned at Y=1. Let's assume height is 2.
    // Box from Y=0 to Y=2.
    
    enemyBox.min.set(newPos.x - enemyRadius, 0.1, newPos.z - enemyRadius);
    enemyBox.max.set(newPos.x + enemyRadius, 1.9, newPos.z + enemyRadius);

    let collided = false;
    scene.traverse((obj) => {
      if (collided) return;
      if (obj.userData.type === 'wall') {
        const wallBox = new THREE.Box3().setFromObject(obj);
        if (enemyBox.intersectsBox(wallBox)) {
          collided = true;
        }
      }
    });
    return collided;
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isDead) {
      // DEATH ANIMATION: Fall backward
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -Math.PI / 2, delta * 5);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.2, delta * 5);
      return;
    }

    // --- ALIVE LOGIC ---

    // 1. AI: Look at player
    const targetPos = new THREE.Vector3(camera.position.x, groupRef.current.position.y, camera.position.z);
    groupRef.current.lookAt(targetPos);

    // 2. AI: Move towards player (with collision)
    const myPos = groupRef.current.position;
    const playerPos = camera.position;
    const dist = new THREE.Vector3(myPos.x, 0, myPos.z).distanceTo(new THREE.Vector3(playerPos.x, 0, playerPos.z));
    
    let isMoving = false;
    
    if (dist > 3) {
      isMoving = true;
      const moveSpeed = 2.5 * delta;
      const dir = new THREE.Vector3().subVectors(playerPos, myPos).normalize();
      dir.y = 0; 
      
      // Attempt Move X
      const candidateX = myPos.clone();
      candidateX.x += dir.x * moveSpeed;
      if (!checkCollision(candidateX)) {
        myPos.x = candidateX.x;
      }

      // Attempt Move Z
      const candidateZ = myPos.clone();
      candidateZ.z += dir.z * moveSpeed;
      if (!checkCollision(candidateZ)) {
        myPos.z = candidateZ.z;
      }
    }

    // 3. Procedural Animation
    const time = state.clock.elapsedTime * 10;
    
    if (isMoving) {
        // Walk Cycle (Sine waves)
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time) * 0.5;
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time + Math.PI) * 0.5;
        
        // Arms swing opposite to legs
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time + Math.PI) * 0.5;
        // Right arm holds gun
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.PI / 2 + Math.sin(time) * 0.1;
    } else {
        // Idle
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.PI / 2;
    }
  });

  return (
    <group ref={groupRef} position={data.position}>
      {/* HEAD */}
      <mesh 
        position={[0, 0.65, 0]} 
        castShadow 
        receiveShadow
        userData={hitData}
        material={materials.skin}
      >
        <boxGeometry args={[0.25, 0.25, 0.25]} />
      </mesh>

      {/* TORSO */}
      <mesh 
        position={[0, 0.15, 0]} 
        castShadow 
        receiveShadow
        userData={hitData}
        material={materials.shirt}
      >
        <boxGeometry args={[0.45, 0.6, 0.25]} />
      </mesh>

      {/* RIGHT ARM GROUP (Shoulder Pivot) */}
      <group ref={rightArmRef} position={[0.32, 0.4, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow userData={hitData} material={materials.shirt}>
            <boxGeometry args={[0.12, 0.5, 0.12]} />
        </mesh>
        
        {/* WEAPON Attached to Hand */}
        <group position={[0, -0.5, 0]}>
             <mesh position={[0, 0.1, 0.2]} castShadow userData={hitData} material={materials.gun}>
                <boxGeometry args={[0.08, 0.12, 0.35]} />
             </mesh>
             <mesh position={[0, 0.15, 0.4]} castShadow userData={hitData} material={materials.gun}>
                 <boxGeometry args={[0.03, 0.03, 0.15]} />
             </mesh>
             <mesh position={[0, -0.05, 0.15]} castShadow userData={hitData} material={materials.gun}>
                 <boxGeometry args={[0.06, 0.15, 0.08]} />
             </mesh>
        </group>
      </group>

      {/* LEFT ARM GROUP (Shoulder Pivot) */}
      <group ref={leftArmRef} position={[-0.32, 0.4, 0]}>
         <mesh position={[0, -0.25, 0]} castShadow userData={hitData} material={materials.shirt}>
            <boxGeometry args={[0.12, 0.5, 0.12]} />
        </mesh>
      </group>

      {/* RIGHT LEG GROUP (Hip Pivot) */}
      <group ref={rightLegRef} position={[0.12, -0.15, 0]}>
         <mesh position={[0, -0.4, 0]} castShadow userData={hitData} material={materials.pants}>
            <boxGeometry args={[0.16, 0.8, 0.16]} />
        </mesh>
      </group>

      {/* LEFT LEG GROUP (Hip Pivot) */}
      <group ref={leftLegRef} position={[-0.12, -0.15, 0]}>
         <mesh position={[0, -0.4, 0]} castShadow userData={hitData} material={materials.pants}>
            <boxGeometry args={[0.16, 0.8, 0.16]} />
        </mesh>
      </group>

      {!isDead && (
        <group position={[0, 1.1, 0]}>
          <Text fontSize={0.2} color="white" anchorX="center" anchorY="bottom">
            {data.hp} HP
          </Text>
        </group>
      )}
    </group>
  );
};