import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Sky, Stars, Loader } from '@react-three/drei';
import { GameScene } from './components/GameScene';
import { GameUI } from './components/GameUI';

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(100);

  const handleScoreUpdate = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* 3D Scene */}
      <Canvas shadows camera={{ fov: 75, position: [0, 2, 0] }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Ambient & Directional Light */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        
        <GameScene 
          onScore={handleScoreUpdate} 
          isLocked={isLocked}
        />
        
        <PointerLockControls 
          onLock={() => setIsLocked(true)} 
          onUnlock={() => setIsLocked(false)} 
        />
      </Canvas>

      {/* Heads Up Display */}
      <GameUI 
        score={score} 
        health={playerHealth} 
        isPaused={!isLocked} 
      />
      
      <Loader />
    </div>
  );
};

export default App;