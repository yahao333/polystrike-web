
import React, { useState, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { LevelMap } from './LevelMap';
import { EnemyData, MapTheme } from '../types';
import * as THREE from 'three';

interface GameSceneProps {
  onScore: (amount: number) => void;
  isLocked: boolean;
  theme: MapTheme;
}

export const GameScene: React.FC<GameSceneProps> = ({ onScore, isLocked, theme }) => {
  const { camera, scene } = useThree();
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  
  // Spawn logic
  useEffect(() => {
    // Initial spawn
    spawnEnemy();
    spawnEnemy();
    spawnEnemy();
  }, []);

  const spawnEnemy = () => {
    const id = Math.random().toString(36).substr(2, 9);
    // Random position within arena bounds (-20 to 20)
    const x = (Math.random() - 0.5) * 40;
    const z = (Math.random() - 0.5) * 40;
    
    // 50% Chance for Creeper
    const type: 'soldier' | 'creeper' = Math.random() > 0.5 ? 'creeper' : 'soldier';
    
    setEnemies(prev => [...prev, {
      id,
      position: [x, 1, z], // Y=1 so they stand on floor
      hp: 100,
      maxHp: 100,
      status: 'alive',
      enemyType: type
    }]);
  };

  const handleShoot = () => {
    if (!isLocked) return;

    // Raycasting logic
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: 0, y: 0 }, camera); // Shoot from center of screen

    // Find intersections with enemies
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
      const hitObj = intersects[i].object;
      
      // Check if we hit a wall first (walls should block shots)
      if (hitObj.userData.type === 'wall' || hitObj.userData.type === 'floor') {
        // Hit map geometry, stop ray
        createImpactEffect(intersects[i].point);
        break; 
      }

      // Check if we hit an enemy
      if (hitObj.userData.type === 'enemy') {
        const enemyId = hitObj.userData.id;
        damageEnemy(enemyId);
        createImpactEffect(intersects[i].point, true); // Blood effect color
        break; // Only hit the first enemy
      }
    }
  };

  const createImpactEffect = (point: THREE.Vector3, isBlood = false) => {
    // Ideally, spawn a particle system here. 
  };

  const damageEnemy = (id: string) => {
    setEnemies(prev => {
      const updated = prev.map(e => {
        if (e.id !== id) return e;
        if (e.status === 'dead') return e; // Already dead

        const newHp = e.hp - 35; // 3 shots to kill
        
        if (newHp <= 0) {
          // Trigger death logic
          onScore(100);
          
          // Remove from list after delay so animation can play
          setTimeout(() => {
            setEnemies(curr => curr.filter(en => en.id !== id));
            // Respawn a new one
            setTimeout(() => spawnEnemy(), 1000);
          }, 3000);

          return { ...e, hp: 0, status: 'dead' };
        }
        
        return { ...e, hp: newHp };
      });
      
      return updated as EnemyData[];
    });
  };

  return (
    <group>
      <LevelMap theme={theme} />
      
      <Player 
        onShoot={handleShoot} 
        isLocked={isLocked}
      />

      {enemies.map(enemy => (
        <Enemy 
          key={enemy.id} 
          data={enemy} 
        />
      ))}
    </group>
  );
};
