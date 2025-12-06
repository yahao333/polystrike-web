import React from 'react';

interface GameUIProps {
  score: number;
  health: number;
  isPaused: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({ score, health, isPaused }) => {
  return (
    <>
      {/* Crosshair */}
      <div className="crosshair">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="lime" strokeWidth="2">
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>

      {/* HUD - Bottom Row */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none text-white font-mono select-none">
        {/* Health */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-400 uppercase tracking-widest mb-1">Health</span>
          <div className="text-4xl font-bold flex items-baseline gap-2">
            <span className={health < 30 ? "text-red-500" : "text-white"}>{health}</span>
            <span className="text-lg text-gray-400">+</span>
          </div>
          <div className="w-48 h-2 bg-gray-800 mt-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${health < 30 ? "bg-red-500" : "bg-green-500"}`} 
              style={{ width: `${health}%` }}
            />
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col text-right">
          <span className="text-sm text-gray-400 uppercase tracking-widest mb-1">Score</span>
          <div className="text-4xl font-bold text-yellow-400">{score.toString().padStart(4, '0')}</div>
        </div>
      </div>

      {/* Pause / Start Screen Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center p-8 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">POLY<span className="text-yellow-500">STRIKE</span></h1>
            <p className="text-gray-400 mb-8">Browser Ops v1.0</p>
            
            <div className="space-y-2 text-sm text-gray-300 mb-8 text-left bg-gray-800 p-4 rounded">
              <p><span className="font-bold text-yellow-500">WASD</span> to Move</p>
              <p><span className="font-bold text-yellow-500">MOUSE</span> to Aim</p>
              <p><span className="font-bold text-yellow-500">CLICK</span> to Shoot</p>
            </div>

            <div className="text-green-400 animate-pulse font-mono text-lg border-2 border-green-500/50 p-2 rounded cursor-pointer pointer-events-auto hover:bg-green-500/10 transition-colors">
              CLICK TO START
            </div>
          </div>
        </div>
      )}
    </>
  );
};