
import React, { useRef } from 'react';
import { CalibrationState, Orientation, ColorMode } from '../types';

interface Props {
  state: CalibrationState;
  onUpdate: (updates: Partial<CalibrationState>) => void;
}

const Controls: React.FC<Props> = ({ state, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({ videoUrl: url, isPlaying: true });
    }
  };

  const LPI_MIN = 240;
  const LPI_MAX = 280;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* MEDIA SECTION */}
      <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">3D Media Engine</label>
          {state.videoUrl && (
            <button 
              onClick={() => onUpdate({ videoUrl: null, isPlaying: false })}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >FECHAR VÍDEO</button>
          )}
        </div>
        
        <div className="flex gap-2">
          {!state.videoUrl ? (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              ABRIR VÍDEO SBS
            </button>
          ) : (
            <button 
              onClick={() => onUpdate({ isPlaying: !state.isPlaying })}
              className={`flex-1 py-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${state.isPlaying ? 'bg-amber-600 text-white' : 'bg-green-600 text-white'}`}
            >
              {state.isPlaying ? (
                <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> PAUSAR</>
              ) : (
                <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> REPRODUZIR</>
              )}
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="video/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* CALIBRATION SECTION */}
      <div className="space-y-4">
        {/* LPI SLIDER */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-gray-300">Calibração LPI (240-280)</label>
            <div className="flex items-center gap-1">
              <div className="flex bg-gray-800 rounded overflow-hidden mr-2">
                 <button onClick={() => onUpdate({ lpi: Math.max(LPI_MIN, state.lpi - 0.001) })} className="px-2 py-1 text-[8px] hover:bg-blue-600 border-r border-gray-700">-001</button>
                 <button onClick={() => onUpdate({ lpi: Math.max(LPI_MIN, state.lpi - 0.1) })} className="px-2 py-1 text-[8px] hover:bg-blue-600">-0.1</button>
              </div>
              <span className="font-mono text-blue-400 w-20 text-center text-sm font-bold">{state.lpi.toFixed(3)}</span>
              <div className="flex bg-gray-800 rounded overflow-hidden ml-2">
                <button onClick={() => onUpdate({ lpi: Math.min(LPI_MAX, state.lpi + 0.1) })} className="px-2 py-1 text-[8px] hover:bg-blue-600 border-r border-gray-700">+0.1</button>
                <button onClick={() => onUpdate({ lpi: Math.min(LPI_MAX, state.lpi + 0.001) })} className="px-2 py-1 text-[8px] hover:bg-blue-600">+001</button>
              </div>
            </div>
          </div>
          <input type="range" min={LPI_MIN} max={LPI_MAX} step="0.001" value={state.lpi} onChange={(e) => onUpdate({ lpi: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>

        {/* OFFSET SLIDER */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-gray-300">Fase (Alinhamento 3D)</label>
            <span className="font-mono text-green-400">{state.offset.toFixed(3)}</span>
          </div>
          <input type="range" min="-1" max="1" step="0.001" value={state.offset} onChange={(e) => onUpdate({ offset: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-gray-500 uppercase tracking-tighter">Orientação</label>
              <button 
                onClick={() => onUpdate({ autoOrientation: !state.autoOrientation })}
                className={`text-[8px] px-1 rounded border ${state.autoOrientation ? 'border-blue-500 text-blue-500 bg-blue-500/10' : 'border-gray-600 text-gray-500'}`}
              >
                AUTO: {state.autoOrientation ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onUpdate({ orientation: Orientation.VERTICAL, autoOrientation: false })} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${state.orientation === Orientation.VERTICAL && !state.autoOrientation ? 'bg-blue-600 text-white' : state.orientation === Orientation.VERTICAL ? 'bg-blue-900/40 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>VERT</button>
              <button onClick={() => onUpdate({ orientation: Orientation.HORIZONTAL, autoOrientation: false })} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${state.orientation === Orientation.HORIZONTAL && !state.autoOrientation ? 'bg-blue-600 text-white' : state.orientation === Orientation.HORIZONTAL ? 'bg-blue-900/40 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>HORIZ</button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-tighter">Modo Sub-Pixel</label>
            <div className="flex gap-1">
              <button onClick={() => onUpdate({ colorMode: ColorMode.BW })} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${state.colorMode === ColorMode.BW ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}`}>OFF</button>
              <button onClick={() => onUpdate({ colorMode: ColorMode.RGB })} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${state.colorMode === ColorMode.RGB ? 'bg-gradient-to-r from-red-600 via-green-600 to-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>RGB</button>
            </div>
          </div>
        </div>
      </div>

      <details className="text-[10px] pt-2 border-t border-white/5">
        <summary className="text-gray-500 cursor-pointer py-1">Avançado (PPI da Tela)</summary>
        <div className="mt-2 space-y-3 bg-white/5 p-2 rounded">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Display PPI:</span>
            <span className="text-blue-300 font-mono">{state.basePpi}</span>
          </div>
          <input type="range" min="100" max="1000" step="1" value={state.basePpi} onChange={(e) => onUpdate({ basePpi: parseInt(e.target.value) })} className="w-full h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-gray-400" />
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => onUpdate({ basePpi: 506 })} className="p-1 bg-gray-800 rounded text-[8px]">S22 Ultra</button>
            <button onClick={() => onUpdate({ basePpi: 460 })} className="p-1 bg-gray-800 rounded text-[8px]">iPhone 14</button>
            <button onClick={() => onUpdate({ basePpi: 326 })} className="p-1 bg-gray-800 rounded text-[8px]">Padrão</button>
          </div>
        </div>
      </details>
    </div>
  );
};

export default Controls;
