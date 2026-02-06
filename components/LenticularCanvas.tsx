
import React, { useRef, useEffect, useCallback } from 'react';
import { CalibrationState, Orientation, ColorMode } from '../types';

interface Props {
  state: CalibrationState;
  onUpdate: (updates: Partial<CalibrationState>) => void;
}

const LenticularCanvas: React.FC<Props> = ({ state, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Persistent auxiliary canvases to avoid garbage collection pressure and allocation overhead
  const v1Canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const v2Canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const maskCanvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const compCanvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  
  // Cache for avoiding redundant mask calculations
  const lastMaskKey = useRef<string>("");

  useEffect(() => {
    const video = document.createElement('video');
    video.style.display = 'none';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    videoRef.current = video;

    return () => {
      video.pause();
      video.src = "";
      video.load();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (state.videoUrl && video.src !== state.videoUrl) {
      video.src = state.videoUrl;
      video.load();
    }

    if (state.isPlaying) {
      // Use catch to handle interrupted play() requests (e.g. rapid pause/play)
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [state.videoUrl, state.isPlaying]);

  const updateMask = (width: number, height: number, dpr: number) => {
    const { lpi, offset, thickness, orientation, colorMode, basePpi } = state;
    
    // Safety check for critical numbers
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
    
    ctx.fillStyle = '#fff';

    const dim = isVertical ? width : height;
    const lensCount = Math.ceil(dim / pixelsPerLens) + 2;
    const stripeWidth = Math.max(0.1, pixelsPerLens * thickness);

    // Render the interlacing mask
    for (let i = -1; i < lensCount; i++) {
      const pos = i * pixelsPerLens - (phaseShift % pixelsPerLens);
      if (isVertical) {
        ctx.fillRect(pos, 0, stripeWidth, height);
      } else {
        ctx.fillRect(0, pos, width, stripeWidth);
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
    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const video = videoRef.current;
    
    // Check if video is actually ready for drawing to avoid InvalidStateError or NaN errors
    const isVideoReady = !!(state.videoUrl && video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0);

    try {
      if (!isVideoReady) {
        // --- CALIBRATION MODE ---
        updateMask(width, height, dpr);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
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
        return;
      }

      // --- VIDEO MODE (SBS) ---
      const vW = video!.videoWidth;
      const vH = video!.videoHeight;
      const sbsWidth = vW / 2;
      const videoAspect = sbsWidth / vH;
      const canvasAspect = width / height;

      // Safe aspect ratio calculations
      let dW, dH, dX, dY;
      if (videoAspect > canvasAspect) {
        dW = width;
        dH = width / videoAspect;
        dX = 0;
        dY = (height - dH) / 2;
      } else {
        dH = height;
        dW = height * videoAspect;
        dX = (width - dW) / 2;
        dY = 0;
      }

      // Validate dimensions to prevent drawImage crashes
      if (isNaN(dW) || isNaN(dH) || isNaN(dX) || isNaN(dY) || dW <= 0 || dH <= 0) return;

      // 1. Prepare View 1 (Left Eye) buffer
      const ctx1 = v1Canvas.current.getContext('2d', { alpha: false });
      if (ctx1) {
        ctx1.imageSmoothingEnabled = false;
        ctx1.fillStyle = '#000';
        ctx1.fillRect(0, 0, width, height);
        ctx1.drawImage(video!, 0, 0, sbsWidth, vH, dX, dY, dW, dH);
      }

      // 2. Prepare View 2 (Right Eye) buffer
      const ctx2 = v2Canvas.current.getContext('2d', { alpha: false });
      if (ctx2) {
        ctx2.imageSmoothingEnabled = false;
        ctx2.fillStyle = '#000';
        ctx2.fillRect(0, 0, width, height);
        ctx2.drawImage(video!, sbsWidth, 0, sbsWidth, vH, dX, dY, dW, dH);
      }

      // 3. Update Calibration Mask (Cached)
      updateMask(width, height, dpr);

      // 4. Final Composition
      // Layer 1: Right Eye (Base)
      ctx.drawImage(v2Canvas.current, 0, 0);
      
      // Layer 2: Masked Left Eye
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
      // Catch rare Canvas or Video DOM errors during transitions
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
      
      // Sync auxiliary buffers dimensions outside of draw() to prevent layout thrashing
      [v1Canvas, v2Canvas, maskCanvas, compCanvas].forEach(ref => {
        ref.current.width = newWidth;
        ref.current.height = newHeight;
      });
      
      lastMaskKey.current = ""; // Invalidate cache
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
