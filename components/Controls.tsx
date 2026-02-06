
import React, { useRef, useState, useEffect } from 'react';
import { CalibrationState, Orientation, ColorMode } from '../types';

interface Props {
  state: CalibrationState;
  onUpdate: (updates: Partial<CalibrationState>) => void;
}

const Controls: React.FC<Props> = ({ state, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anchorLpi, setAnchorLpi] = useState<number>(state.lpi);

  const LPI_MIN = 10;
  const LPI_MAX = 500;
  const DEFAULT_LPI = 260.0;
  const PRECISION_RANGE = 0.05; 

  const RATIOS: ('auto' | '16:9' | '4:3' | '21:9' | '1:1')[] = ['auto', '16:9', '4:3', '21:9', '1:1'];

  useEffect(() => {
    if (state.precisionMode) {
      setAnchorLpi(state.lpi);
    }
  }, [state.precisionMode]);

  useEffect(() => {
    if (state.precisionMode) {
      const diff = Math.abs(state.lpi - anchorLpi);
      if (diff > PRECISION_RANGE * 0.8) {
        setAnchorLpi(state.lpi);
      }
    }
  }, [state.lpi, state.precisionMode, anchorLpi]);

  const handleReset = () => {
    onUpdate({
      lpi: DEFAULT_LPI,
      offset: 0.0,
      precisionMode: false
    });
    setAnchorLpi(DEFAULT_LPI);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const isImage = file.type.startsWith('image/');
      onUpdate({ 
        mediaUrl: url, 
        mediaType: isImage ? 'image' : 'video',
        isPlaying: true 
      });
    }
  };

  const cycleRatio = () => {
    const currentIndex = RATIOS.indexOf(state.videoRatio);
    const nextIndex = (currentIndex + 1) % RATIOS.length;
    onUpdate({ videoRatio: RATIOS[nextIndex] });
  };

  let sMin = LPI_MIN;
  let sMax = LPI_MAX;
  let sStep = "0.01";
  
  if (state.precisionMode) {
    sMin = anchorLpi - PRECISION_RANGE;
    sMax = anchorLpi + PRECISION_RANGE;
    sStep = "0.00001";
  }

  return (
    <div className="space-y-2 max-w-md mx-auto">
      {/* SEÇÃO DE MÍDIA */}
      <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest">3D SBS Media</label>
          <div className="flex gap-2">
            {state.mediaUrl && (
              <button 
                onClick={cycleRatio}
                className="text-[8px] text-blue-400 font-black bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
              >
                RATIO: {state.videoRatio.toUpperCase()}
              </button>
            )}
            {state.mediaUrl && (
              <button 
                onClick={() => onUpdate({ mediaUrl: null, mediaType: null, isPlaying: false })}
                className="text-[8px] text-red-500 font-bold flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded"
              >
                FECHAR
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
          {!state.mediaUrl ? (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 bg-blue-600 active:bg-blue-800 text-white rounded-md text-[9px] font-black shadow-lg shadow-blue-900/10"
            >ABRIR MÍDIA 3D (FOTO/VÍDEO)</button>
          ) : (
            <button 
              onClick={() => onUpdate({ isPlaying: !state.isPlaying })}
              className={`flex-1 py-2 rounded-md text-[9px] font-black transition-all ${state.isPlaying ? 'bg-amber-600 text-white' : 'bg-green-600 text-white'}`}
            >
              {state.mediaType === 'video' ? (state.isPlaying ? 'PAUSAR' : 'REPRODUZIR') : (state.isPlaying ? 'OCULTAR' : 'MOSTRAR')}
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="video/*,image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* CONTROLE DE LPI */}
      <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 space-y-2.5 shadow-xl">
        <div className="flex justify-between items-end">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Frequência (LPI)</span>
              <button 
                onClick={handleReset}
                className="p-0.5 text-gray-500 hover:text-red-400 active:rotate-180 transition-all duration-500"
                title="Resetar"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h5M20 20v-5h-5M20 9.414A9 9 0 1018.607 15" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-mono font-black tabular-nums transition-colors ${state.precisionMode ? 'text-blue-400' : 'text-blue-200'}`}>
                {state.lpi.toFixed(4)}
              </span>
              
              <div className="flex items-center bg-gray-900/80 rounded border border-gray-800 p-0.5 shadow-inner">
                <span className="px-1.5 text-[7px] font-black text-gray-500 uppercase tracking-tighter">PRECISÃO</span>
                <button 
                  onClick={() => onUpdate({ precisionMode: !state.precisionMode })}
                  className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${state.precisionMode ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400 animate-pulse' : 'bg-gray-800 text-gray-400 opacity-60'}`}
                >
                  {state.precisionMode ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-8 flex items-center">
          <input 
            type="range" 
            min={sMin} 
            max={sMax} 
            step={sStep} 
            value={state.lpi} 
            onChange={(e) => onUpdate({ lpi: parseFloat(e.target.value) })}
            className={`w-full h-3 bg-transparent appearance-none cursor-pointer relative z-10 ${state.precisionMode ? 'accent-blue-400' : 'accent-white'}`}
          />
        </div>
      </div>

      {/* CONTROLE DE FASE */}
      <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-1">
        <div className="flex justify-between items-center text-[8px] font-bold uppercase text-gray-500">
          <span>Alinhamento Lateral</span>
          <span className="text-green-400 font-mono text-[10px]">{state.offset.toFixed(3)}</span>
        </div>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.001" 
          value={state.offset} 
          onChange={(e) => onUpdate({ offset: parseFloat(e.target.value) })}
          className="w-full h-1 bg-gray-800 rounded-full appearance-none accent-green-500"
        />
      </div>

      {/* BOTÕES DE CONFIGURAÇÃO RÁPIDA */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-gray-600 uppercase">Grade</label>
          <div className="flex gap-1">
            <button onClick={() => onUpdate({ orientation: Orientation.VERTICAL })} className={`flex-1 py-1.5 text-[8px] font-black rounded-md ${state.orientation === Orientation.VERTICAL ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}`}>VERT</button>
            <button onClick={() => onUpdate({ orientation: Orientation.HORIZONTAL })} className={`flex-1 py-1.5 text-[8px] font-black rounded-md ${state.orientation === Orientation.HORIZONTAL ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}`}>HORIZ</button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-gray-600 uppercase">Sub-Pixel</label>
          <div className="flex gap-1">
            <button onClick={() => onUpdate({ colorMode: ColorMode.BW })} className={`flex-1 py-1.5 text-[8px] font-black rounded-md ${state.colorMode === ColorMode.BW ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}`}>OFF</button>
            <button onClick={() => onUpdate({ colorMode: ColorMode.RGB })} className={`flex-1 py-1.5 text-[8px] font-black rounded-md ${state.colorMode === ColorMode.RGB ? 'bg-gradient-to-r from-red-600/60 via-green-600/60 to-blue-600/60 text-white' : 'bg-gray-800 text-gray-400'}`}>RGB</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
