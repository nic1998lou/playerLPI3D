
import React, { useState, useCallback, useEffect } from 'react';
import { Orientation, ColorMode, CalibrationState } from './types';
import LenticularCanvas from './components/LenticularCanvas';
import Controls from './components/Controls';

const App: React.FC = () => {
  const [state, setState] = useState<CalibrationState>({
    lpi: 260.0,
    offset: 0.0,
    thickness: 0.5,
    orientation: Orientation.VERTICAL,
    colorMode: ColorMode.BW,
    basePpi: 500,
    videoUrl: null,
    isPlaying: false,
    autoOrientation: true
  });

  const [isUiVisible, setIsUiVisible] = useState(true);

  const toggleUi = useCallback(() => {
    setIsUiVisible(prev => !prev);
  }, []);

  const updateState = useCallback((updates: Partial<CalibrationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const handleOrientationChange = () => {
      if (!state.autoOrientation) return;
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      updateState({
        orientation: isLandscape ? Orientation.HORIZONTAL : Orientation.VERTICAL
      });
    };

    const orientationMedia = window.matchMedia("(orientation: landscape)");
    orientationMedia.addEventListener('change', handleOrientationChange);
    handleOrientationChange();

    return () => {
      orientationMedia.removeEventListener('change', handleOrientationChange);
    };
  }, [state.autoOrientation, updateState]);

  return (
    <div className="relative w-screen h-screen bg-black select-none overflow-hidden flex flex-col">
      {/* Rendering Layer */}
      <div className="absolute inset-0">
        <LenticularCanvas state={state} onUpdate={updateState} />
      </div>

      {/* UI Overlay */}
      <div 
        className={`relative z-10 flex flex-col h-full transition-opacity duration-300 ${isUiVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Header com Safe Area Top */}
        <div className="pt-[env(safe-area-inset-top)] bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-blue-400">3D LPI Studio</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Lenticular SBS Interlacer</p>
              </div>
              {state.videoUrl && (
                <div className="bg-blue-600/20 border border-blue-500/50 px-2 py-1 rounded text-[10px] text-blue-400 animate-pulse">
                  3D VIDEO ACTIVE
                </div>
              )}
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-gray-500">LPI:</span>
                <span className="ml-2 font-mono text-blue-300">{state.lpi.toFixed(3)}</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-gray-500">Direção:</span>
                <span className="ml-2 font-mono text-green-300">{state.orientation}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow" />

        {/* Footer com Safe Area Bottom */}
        <div className="bg-black/80 backdrop-blur-md border-t border-white/10 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Controls state={state} onUpdate={updateState} />
        </div>
      </div>

      {/* Botão Flutuante de Toggle */}
      <button
        onClick={toggleUi}
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+110px)] right-4 z-50 p-4 bg-blue-600 rounded-full shadow-2xl active:scale-90 transition-transform"
      >
        {isUiVisible ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.146 5.147m13.71 13.71L14.12 14.12M18.675 5.325A10.05 10.05 0 0121 12c0 1.354-.334 2.633-.925 3.758" />
          </svg>
        )}
      </button>

      {!isUiVisible && (
        <div className="absolute top-[env(safe-area-inset-top,20px)] left-1/2 -translate-x-1/2 pointer-events-none opacity-40 text-[9px] font-bold tracking-[0.4em] uppercase whitespace-nowrap bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          LPI {state.lpi.toFixed(3)} • {state.orientation} {state.autoOrientation ? '(AUTO)' : ''}
        </div>
      )}
    </div>
  );
};

export default App;
