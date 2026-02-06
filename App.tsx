
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
    mediaUrl: null,
    mediaType: null,
    isPlaying: false,
    autoOrientation: true,
    precisionMode: false,
    videoRatio: 'auto'
  });

  const [isUiVisible, setIsUiVisible] = useState(true);

  const toggleUi = useCallback(() => {
    setIsUiVisible(prev => !prev);
  }, []);

  const updateState = useCallback((updates: Partial<CalibrationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const closeMedia = useCallback(() => {
    updateState({ mediaUrl: null, mediaType: null, isPlaying: false });
  }, [updateState]);

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

      {/* Header Fixo */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,20px)] px-4 pointer-events-none">
        <div className="flex justify-between items-center py-2">
          {/* Título */}
          <div className={`transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h1 className="text-sm font-black text-blue-500/80 uppercase tracking-tighter">3D LPI PLAYER</h1>
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
            {/* Botão de Fechar Mídia */}
            {state.mediaUrl && (
              <button 
                onClick={closeMedia}
                className={`p-2 bg-red-600/10 border border-red-500/20 rounded-lg text-red-500 active:scale-90 transition-all duration-300 ${isUiVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}
                title="Fechar Mídia"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Botão de Toggle */}
            <button 
              onClick={toggleUi}
              className="p-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white/70 active:scale-90 transition-transform shadow-lg"
              title={isUiVisible ? "Ocultar Ferramentas" : "Mostrar Ferramentas"}
            >
              {isUiVisible ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.146 5.147m13.71 13.71L14.12 14.12M18.675 5.325A10.05 10.05 0 0121 12c0 1.354-.334 2.633-.925 3.758" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* UI Overlay Inferior */}
      <div 
        className={`relative z-10 flex flex-col h-full transition-opacity duration-300 ${isUiVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex-grow" />

        {/* Footer */}
        <div className="bg-black/60 backdrop-blur-sm border-t border-white/5 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Controls state={state} onUpdate={updateState} />
        </div>
      </div>

      {!isUiVisible && (
        <div className="absolute top-[env(safe-area-inset-top,20px)] left-4 pointer-events-none opacity-40 text-[8px] font-black tracking-widest uppercase whitespace-nowrap bg-black/40 px-2 py-1 rounded border border-white/5 z-40">
          LPI {state.lpi.toFixed(state.precisionMode ? 4 : 3)} • {state.orientation}
        </div>
      )}
    </div>
  );
};

export default App;
