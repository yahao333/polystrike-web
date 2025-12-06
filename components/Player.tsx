import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboard } from '../hooks/useKeyboard';

interface PlayerProps {
  onShoot: () => void;
  isLocked: boolean;
}

export const Player: React.FC<PlayerProps> = ({ onShoot, isLocked }) => {
  const { camera, scene } = useThree();
  const gunContainerRef = useRef<THREE.Group>(null); // Follows camera exactly
  const gunAnimGroupRef = useRef<THREE.Group>(null); // Handles sway and recoil relative to container
  const flashRef = useRef<THREE.Mesh>(null);
  const keys = useKeyboard();
  
  // Animation state refs
  const recoilParams = useRef({
    current: 0, 
  });
  const velocity = useRef(new THREE.Vector3());

  // Audio Context for Chiptune Sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first interaction if possible, or lazily
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      audioCtxRef.current = new Ctx();
    }
  }, []);

  const playShootSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 8-bit style square wave
    osc.type = 'square';
    
    // Pitch envelope: Drop from high to low quickly
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

    // Volume envelope: Short decay
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  // Input listener for shooting
  useEffect(() => {
    const handleMouseDown = () => {
      if (isLocked) {
        onShoot();
        playShootSound();

        // Trigger Recoil: Set impulse to 1.0
        recoilParams.current.current = 1.0;
        
        // Trigger Muzzle Flash
        if (flashRef.current) {
          flashRef.current.visible = true;
          flashRef.current.rotation.z = Math.random() * Math.PI;
          const scale = 0.8 + Math.random() * 0.5;
          flashRef.current.scale.set(scale, scale, 1);
          
          setTimeout(() => {
            if (flashRef.current) flashRef.current.visible = false;
          }, 60);
        }
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [isLocked, onShoot]);

  // --- COLLISION DETECTION HELPER ---
  const checkCollision = (newPos: THREE.Vector3) => {
    const playerRadius = 0.4; 
    const playerBox = new THREE.Box3();
    
    // Create a bounding box for the player at the new position
    // Height 2 units (0 to 2)
    playerBox.min.set(newPos.x - playerRadius, 0.1, newPos.z - playerRadius);
    playerBox.max.set(newPos.x + playerRadius, 1.9, newPos.z + playerRadius);

    // Check against all 'wall' objects in the scene
    let collided = false;
    scene.traverse((obj) => {
      if (collided) return;
      if (obj.userData.type === 'wall') {
        // We calculate the world bounding box of the wall
        // Note: For static objects, caching this would be better, but for this scale it's fine.
        // Cloning the box is safer if the object has one stored, or computing fresh.
        const wallBox = new THREE.Box3().setFromObject(obj);
        if (playerBox.intersectsBox(wallBox)) {
          collided = true;
        }
      }
    });
    return collided;
  };

  useFrame((state, delta) => {
    if (!isLocked) return;

    // --- 1. PLAYER MOVEMENT PHYSICS ---
    // Friction
    velocity.current.x -= velocity.current.x * 10.0 * delta;
    velocity.current.z -= velocity.current.z * 10.0 * delta;

    // Input processing
    const speed = 40.0; // Adjusted for better feel
    const directionZ = Number(keys.forward) - Number(keys.backward);
    const directionX = Number(keys.right) - Number(keys.left);
    
    // Calculate Acceleration
    const inputAccel = new THREE.Vector3();
    if (directionZ !== 0 || directionX !== 0) {
      // Get camera forward/right vectors projected on XZ plane
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();

      inputAccel.add(forward.multiplyScalar(directionZ * speed * delta));
      inputAccel.add(right.multiplyScalar(directionX * speed * delta));
    }

    velocity.current.add(inputAccel);

    // --- COLLISION & MOVEMENT ---
    // We try to move X and Z separately to allow sliding along walls
    
    const currentPos = camera.position.clone();
    
    // Try X movement
    const moveX = velocity.current.x * delta;
    const candidateX = currentPos.clone();
    candidateX.x += moveX;
    
    if (!checkCollision(candidateX)) {
      camera.position.x += moveX;
    } else {
      velocity.current.x = 0; // Stop velocity on hit
    }

    // Update currentPos X for Z check
    const currentPosAfterX = camera.position.clone();

    // Try Z movement
    const moveZ = velocity.current.z * delta;
    const candidateZ = currentPosAfterX.clone();
    candidateZ.z += moveZ;

    if (!checkCollision(candidateZ)) {
      camera.position.z += moveZ;
    } else {
      velocity.current.z = 0; // Stop velocity on hit
    }

    // Lock Y Height
    camera.position.y = 2; 

    // --- 2. SYNC GUN TO CAMERA ---
    if (gunContainerRef.current) {
      gunContainerRef.current.position.copy(camera.position);
      gunContainerRef.current.quaternion.copy(camera.quaternion);
    }

    // --- 3. GUN ANIMATION (Recoil & Sway) ---
    if (gunAnimGroupRef.current) {
      // Smoothly dampen recoil back to 0
      recoilParams.current.current = THREE.MathUtils.lerp(recoilParams.current.current, 0, delta * 12);
      const r = recoilParams.current.current;

      // Calculate Weapon Sway (breathing/walking)
      const time = state.clock.elapsedTime;
      const isMoving = velocity.current.length() > 0.5;
      
      const swaySpeed = isMoving ? 10 : 2;
      const swayMag = isMoving ? 0.05 : 0.005;
      
      const swayX = Math.sin(time * swaySpeed) * swayMag;
      const swayY = Math.abs(Math.cos(time * swaySpeed)) * swayMag; // Bounce up

      // Base offset for the gun relative to camera (Right handed)
      // X: Right, Y: Down, Z: Forward
      const baseX = 0.35;
      const baseY = -0.3;
      const baseZ = -0.6;

      // Apply Recoil Offsets
      // Kick back (Z), Kick up (Rot X), Kick random (Rot Z)
      const kickZ = r * 0.3;     // Move back 0.3 units at max
      const kickRotX = r * 0.5;  // Rotate up 0.5 radians
      const kickRotZ = r * 0.1;  // Tilt slightly

      // Apply to inner group
      gunAnimGroupRef.current.position.set(
        baseX + swayX, 
        baseY + swayY - (swayMag * 0.5), // Lower slightly when swaying up
        baseZ + kickZ
      );

      gunAnimGroupRef.current.rotation.set(
        kickRotX,
        swayX * 0.5, // Turn slightly with sway
        kickRotZ
      );
    }
  });

  // HUD Material Settings: depthTest=false ensures it draws ON TOP of walls
  const renderOnTop = { depthTest: false, renderOrder: 999 };
  const metalMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.3, metalness: 0.8, ...renderOnTop });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#5D4037', roughness: 0.8, ...renderOnTop });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#fca5a5', roughness: 0.6, ...renderOnTop });
  const flashMat = new THREE.MeshBasicMaterial({ color: '#FEF08A', transparent: true, opacity: 0.9, ...renderOnTop });

  return (
    <group ref={gunContainerRef}>
      <group ref={gunAnimGroupRef}>
        
        {/* === WEAPON MODEL (AK Style) === */}
        
        {/* Main Body */}
        <mesh position={[0, 0.05, 0]} castShadow material={metalMat}>
          <boxGeometry args={[0.06, 0.08, 0.3]} />
        </mesh>
        
        {/* Top Cover */}
        <mesh position={[0, 0.1, 0]} castShadow material={metalMat}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>

        {/* Barrel */}
        <mesh position={[0, 0.05, -0.35]} castShadow material={metalMat}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>

        {/* Gas Tube (Above Barrel) */}
        <mesh position={[0, 0.085, -0.25]} castShadow material={woodMat}>
          <boxGeometry args={[0.03, 0.03, 0.2]} />
        </mesh>

        {/* Handguard (Wood) */}
        <mesh position={[0, 0.03, -0.2]} castShadow material={woodMat}>
          <boxGeometry args={[0.05, 0.06, 0.2]} />
        </mesh>

        {/* Stock (Wood) */}
        <mesh position={[0, -0.02, 0.3]} castShadow material={woodMat}>
          <boxGeometry args={[0.05, 0.12, 0.25]} />
        </mesh>

        {/* Magazine (Curved) */}
        <mesh position={[0, -0.15, -0.05]} rotation={[0.3, 0, 0]} castShadow material={metalMat}>
          <boxGeometry args={[0.055, 0.25, 0.08]} />
        </mesh>

        {/* Pistol Grip */}
        <mesh position={[0, -0.1, 0.15]} rotation={[-0.3, 0, 0]} castShadow material={woodMat}>
          <boxGeometry args={[0.05, 0.15, 0.06]} />
        </mesh>

        {/* Sights */}
        <mesh position={[0, 0.12, -0.45]} material={metalMat}><boxGeometry args={[0.01, 0.03, 0.01]} /></mesh>
        <mesh position={[0, 0.12, 0.1]} material={metalMat}><boxGeometry args={[0.04, 0.02, 0.01]} /></mesh>

        {/* === ARMS === */}
        
        {/* Right Arm (Holding Grip) */}
        <mesh position={[0.15, -0.2, 0.2]} rotation={[0, 0, -0.2]} material={skinMat}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
        </mesh>
        
        {/* Left Arm (Holding Handguard) - Extends forward */}
        <mesh position={[-0.1, -0.15, -0.1]} rotation={[1.2, 0.5, -0.5]} material={skinMat}>
          <boxGeometry args={[0.09, 0.5, 0.09]} />
        </mesh>

        {/* === MUZZLE FLASH === */}
        <mesh ref={flashRef} position={[0, 0.05, -0.6]} visible={false} material={flashMat}>
           <planeGeometry args={[0.8, 0.8]} />
        </mesh>
      </group>
    </group>
  );
};