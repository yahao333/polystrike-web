import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Sky, Stars, Loader } from '@react-three/drei';
import { GameScene } from './components/GameScene';
import { GameUI } from './components/GameUI';
import { MapTheme } from './types';

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [mapTheme, setMapTheme] = useState<MapTheme>('default');

  const handleScoreUpdate = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);

  // Environment settings based on theme
  const isSpace = mapTheme === 'spaceship';
  const isForest = mapTheme === 'forest';

  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* 3D Scene */}
      <Canvas shadows camera={{ fov: 75, position: [0, 2, 0] }}>
        
        {/* Environment - Conditional based on Map Theme */}
        {isSpace ? (
           <>
             <color attach="background" args={['#000000']} />
             <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
             <ambientLight intensity={0.2} />
             <pointLight position={[10, 10, 10]} intensity={0.8} color="#00ffff" />
             <pointLight position={[-10, 10, -10]} intensity={0.8} color="#ff00ff" />
           </>
        ) : (
           <>
             {isForest ? (
               <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.2} mieCoefficient={0.005} mieDirectionalG={0.8} />
             ) : (
               <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
             )}
             <ambientLight intensity={0.5} />
             <directionalLight 
               position={[10, 20, 10]} 
               intensity={1} 
               castShadow 
               shadow-mapSize={[1024, 1024]} 
             />
           </>
        )}
        
        <GameScene 
          onScore={handleScoreUpdate} 
          isLocked={isLocked}
          theme={mapTheme}
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
        currentTheme={mapTheme}
        onSelectTheme={setMapTheme}
      />
      
      <Loader />
    </div>
  );
};

export default App;
