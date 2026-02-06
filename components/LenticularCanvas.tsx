
import React, { useRef, useEffect, useCallback } from 'react';
import { CalibrationState, Orientation, ColorMode } from '../types';

interface Props {
  state: CalibrationState;
  onUpdate: (updates: Partial<CalibrationState>) => void;
}

const LenticularCanvas: React.FC<Props> = ({ state, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const v1Canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const v2Canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const maskCanvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const compCanvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  
  const lastMaskKey = useRef<string>("");

  useEffect(() => {
    // Setup Video
    const video = document.createElement('video');
    video.style.display = 'none';
    video.loop = true;
    video.muted = false; // Som habilitado
    video.volume = 1.0;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    videoRef.current = video;

    // Setup Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    imageRef.current = img;

    return () => {
      video.pause();
      video.src = "";
      video.load();
      img.src = "";
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const img = imageRef.current;
    if (!video || !img) return;

    if (state.mediaUrl && state.mediaType === 'video') {
      if (video.src !== state.mediaUrl) {
        video.src = state.mediaUrl;
        video.load();
      }
      if (state.isPlaying) {
        video.play().catch((err) => {
          console.warn("Autoplay com som bloqueado. Tentando mudo...", err);
          video.muted = true;
          video.play().catch(e => console.error("Erro fatal ao dar play:", e));
        });
      } else {
        video.pause();
      }
    } else if (state.mediaUrl && state.mediaType === 'image') {
      if (img.src !== state.mediaUrl) {
        img.src = state.mediaUrl;
      }
      if (video) video.pause();
    } else {
      if (video) video.pause();
    }
  }, [state.mediaUrl, state.mediaType, state.isPlaying]);

  const updateMask = (width: number, height: number, dpr: number) => {
    const { lpi, offset, thickness, orientation, colorMode, basePpi } = state;
    
    if (lpi <= 0 || basePpi <= 0 || width <= 0 || height <= 0) return;

    const key = `${width}-${height}-${lpi}-${offset}-${thickness}-${orientation}-${colorMode}-${basePpi}`;
    if (lastMaskKey.current === key) return;
    lastMaskKey.current = key;

    const canvas = maskCanvas.current;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    const pixelsPerLens = (basePpi * dpr) / lpi;
    const phaseShift = (offset * pixelsPerLens);
    const isVertical = orientation === Orientation.VERTICAL;
    const stripeWidth = Math.max(0.1, pixelsPerLens * thickness);
    
    const dim = isVertical ? width : height;
    const lensCount = Math.ceil(dim / pixelsPerLens) + 2;

    if (colorMode === ColorMode.RGB) {
      // Lógica RGB: Divide a faixa em 3 sub-faixas (R, G, B)
      // Ajustamos a largura de cada sub-pixel para caber dentro da stripeWidth definida
      const subWidth = stripeWidth / 3;

      for (let i = -1; i < lensCount; i++) {
        const pos = i * pixelsPerLens - (phaseShift % pixelsPerLens);
        if (isVertical) {
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(pos, 0, subWidth, height);
          ctx.fillStyle = '#00FF00';
          ctx.fillRect(pos + subWidth, 0, subWidth, height);
          ctx.fillStyle = '#0000FF';
          ctx.fillRect(pos + (subWidth * 2), 0, subWidth, height);
        } else {
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(0, pos, width, subWidth);
          ctx.fillStyle = '#00FF00';
          ctx.fillRect(0, pos + subWidth, width, subWidth);
          ctx.fillStyle = '#0000FF';
          ctx.fillRect(0, pos + (subWidth * 2), width, subWidth);
        }
      }
    } else {
      // Lógica Padrão (Branco/Sólido)
      ctx.fillStyle = '#fff';
      for (let i = -1; i < lensCount; i++) {
        const pos = i * pixelsPerLens - (phaseShift % pixelsPerLens);
        if (isVertical) {
          ctx.fillRect(pos, 0, stripeWidth, height);
        } else {
          ctx.fillRect(0, pos, width, stripeWidth);
        }
      }
    }
  };

  const draw = useCallback(() => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;
    const ctx = mainCanvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = mainCanvas.width;
    const height = mainCanvas.height;
    const dpr = window.devicePixelRatio || 1;
    const video = videoRef.current;
    const image = imageRef.current;
    
    const isVideoReady = !!(state.mediaUrl && state.mediaType === 'video' && video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0);
    const isImageReady = !!(state.mediaUrl && state.mediaType === 'image' && image && image.complete && image.naturalWidth > 0);
    const isPlaying = state.isPlaying;

    try {
      // --- MODO CALIBRAÇÃO (Sem mídia ou Pausado sem mídia carregada) ---
      if (!state.mediaUrl || (!isImageReady && !isVideoReady) || !isPlaying) {
        updateMask(width, height, dpr);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Se for RGB, desenhamos a máscara colorida diretamente
        if (state.colorMode === ColorMode.RGB) {
           ctx.drawImage(maskCanvas.current, 0, 0);
        } else {
          // Se for BW ou GREEN, usamos a técnica de tintura
          const color = state.colorMode === ColorMode.GREEN ? '#0f0' : '#fff';
          const cCtx = compCanvas.current.getContext('2d');
          if (cCtx) {
            cCtx.clearRect(0, 0, width, height);
            cCtx.drawImage(maskCanvas.current, 0, 0);
            cCtx.globalCompositeOperation = 'source-in';
            cCtx.fillStyle = color;
            cCtx.fillRect(0, 0, width, height);
            cCtx.globalCompositeOperation = 'source-over';
            ctx.drawImage(compCanvas.current, 0, 0);
          }
        }
        return;
      }

      // --- MODO MÍDIA SBS (Side-by-Side) ---
      let srcW, srcH;
      let source: HTMLVideoElement | HTMLImageElement;

      if (state.mediaType === 'video') {
        source = video!;
        srcW = video!.videoWidth;
        srcH = video!.videoHeight;
      } else {
        source = image!;
        srcW = image!.naturalWidth;
        srcH = image!.naturalHeight;
      }

      const viewW = srcW / 2;
      const viewH = srcH;
      
      let mediaAspect = viewW / viewH;
      if (state.videoRatio === '16:9') mediaAspect = 16/9;
      else if (state.videoRatio === '4:3') mediaAspect = 4/3;
      else if (state.videoRatio === '21:9') mediaAspect = 21/9;
      else if (state.videoRatio === '1:1') mediaAspect = 1;

      const isVerticalMode = state.orientation === Orientation.VERTICAL;
      
      const topSafePadding = isVerticalMode ? 60 * dpr : 0;
      const bottomToolboxHeight = isVerticalMode ? height * 0.40 : 0;
      
      const availableWidth = width;
      const availableHeight = height - topSafePadding - bottomToolboxHeight;
      
      const targetAspect = availableWidth / availableHeight;

      let drawW, drawH, drawX, drawY;

      if (mediaAspect > targetAspect) {
        drawW = availableWidth;
        drawH = availableWidth / mediaAspect;
        drawX = 0;
        drawY = topSafePadding + (availableHeight - drawH) / 2;
      } else {
        drawH = availableHeight;
        drawW = availableHeight * mediaAspect;
        drawX = (availableWidth - drawW) / 2;
        drawY = topSafePadding;
      }

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      const ctx1 = v1Canvas.current.getContext('2d', { alpha: false });
      if (ctx1) {
        ctx1.imageSmoothingEnabled = false;
        ctx1.fillStyle = '#000';
        ctx1.fillRect(0, 0, width, height);
        ctx1.drawImage(source, 0, 0, viewW, viewH, drawX, drawY, drawW, drawH);
      }

      const ctx2 = v2Canvas.current.getContext('2d', { alpha: false });
      if (ctx2) {
        ctx2.imageSmoothingEnabled = false;
        ctx2.fillStyle = '#000';
        ctx2.fillRect(0, 0, width, height);
        ctx2.drawImage(source, viewW, 0, viewW, viewH, drawX, drawY, drawW, drawH);
      }

      updateMask(width, height, dpr);

      // Composição final para vídeo/imagem
      // Nota: No modo RGB com vídeo, isso usará a máscara (alpha) das listras RGB. 
      // Como todas tem alpha 1, funciona como uma máscara normal.
      // Se quiséssemos separação de canais RGB no vídeo, seria muito mais complexo,
      // então para mídia mantemos o comportamento de entrelaçamento padrão (L/R).
      
      ctx.drawImage(v2Canvas.current, 0, 0);
      
      const cCtx = compCanvas.current.getContext('2d');
      if (cCtx) {
        cCtx.clearRect(0, 0, width, height);
        cCtx.drawImage(v1Canvas.current, 0, 0);
        cCtx.globalCompositeOperation = 'destination-in';
        cCtx.drawImage(maskCanvas.current, 0, 0);
        cCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(compCanvas.current, 0, 0);
      }
    } catch (err) {
      console.warn("Render loop warning:", err);
    }
  }, [state]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    const newWidth = Math.max(1, Math.floor(w * dpr));
    const newHeight = Math.max(1, Math.floor(h * dpr));

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      
      [v1Canvas, v2Canvas, maskCanvas, compCanvas].forEach(ref => {
        ref.current.width = newWidth;
        ref.current.height = newHeight;
      });
      
      lastMaskKey.current = "";
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full bg-black touch-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default LenticularCanvas;
