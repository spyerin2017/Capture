import React, { useEffect, useRef, useState } from 'react';
import { CapturedFrame } from '../types';
import { Button } from './Button';
import { Trash2, Download, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';

interface StitchEditorProps {
  frames: CapturedFrame[];
  onDeleteFrame: (id: string) => void;
  onReorderFrame: (id: string, direction: 'up' | 'down') => void;
  onAnalyze: (image: string) => void;
  onReset: () => void;
}

export const StitchEditor: React.FC<StitchEditorProps> = ({ 
  frames, 
  onDeleteFrame, 
  onReorderFrame, 
  onAnalyze,
  onReset
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stitchedImage, setStitchedImage] = useState<string | null>(null);

  // Generate the stitched image whenever frames change
  useEffect(() => {
    if (frames.length === 0) {
      setStitchedImage(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Calculate total dimensions
    // Assuming vertical stitching for "Long Screenshot"
    // We take the width of the first frame as reference, others scale to fit or we take max width.
    // For simplicity, let's assume max width.
    const maxWidth = Math.max(...frames.map(f => f.width));
    const totalHeight = frames.reduce((acc, f) => acc + f.height, 0);

    canvas.width = maxWidth;
    canvas.height = totalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentY = 0;
    frames.forEach(frame => {
      const img = new Image();
      img.onload = () => {
        // Center image if smaller than max width
        const x = (maxWidth - frame.width) / 2;
        ctx.drawImage(img, x, currentY);
        
        // Draw a subtle divider line for visual debugging if needed (optional)
        // ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        // ctx.beginPath(); ctx.moveTo(0, currentY); ctx.lineTo(maxWidth, currentY); ctx.stroke();

        currentY += frame.height; // Logic error potential: onload is async. 
        // Sync drawing is needed for reliability here. 
        // Actually, since dataUrl is already loaded in memory, we can try to draw immediately? 
        // No, Image() needs onload.
      };
      img.src = frame.dataUrl;
      // Because we need order, we must wait or chain.
    });

    // CORRECT APPROACH: Chain the loading to ensure order
    const drawImages = async () => {
        let yOffset = 0;
        for (const frame of frames) {
            await new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const x = (maxWidth - frame.width) / 2;
                    ctx.drawImage(img, x, yOffset);
                    yOffset += frame.height;
                    resolve();
                };
                img.src = frame.dataUrl;
            });
        }
        setStitchedImage(canvas.toDataURL('image/png'));
    };
    
    drawImages();

  }, [frames]);

  const handleDownload = () => {
    if (!stitchedImage) return;
    const link = document.createElement('a');
    link.href = stitchedImage;
    link.download = `snapstream-stitched-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-6">
      {/* Left Sidebar: Controls & List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Frame Editor</h2>
          <p className="text-slate-400 text-sm mb-4">
            {frames.length} frames captured. Reorder or remove frames to perfect your long screenshot.
          </p>
          
          <div className="flex gap-2 mb-6">
            <Button onClick={handleDownload} disabled={!stitchedImage} icon={<Download size={18}/>}>
              Download
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => stitchedImage && onAnalyze(stitchedImage)} 
              disabled={!stitchedImage}
              icon={<Sparkles size={18}/>}
            >
              Analyze with AI
            </Button>
            <Button variant="ghost" onClick={onReset} className="text-red-400 hover:text-red-300">
                Discard All
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-2 space-y-2">
            {frames.map((frame, index) => (
                <div key={frame.id} className="bg-slate-900 p-2 rounded flex items-center gap-3 group">
                    <span className="text-slate-500 font-mono w-6 text-center">{index + 1}</span>
                    <img src={frame.dataUrl} className="w-16 h-12 object-cover rounded border border-slate-700" alt={`Frame ${index}`} />
                    <div className="flex-1 text-xs text-slate-400">
                        {frame.width}x{frame.height}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onReorderFrame(frame.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30"
                        >
                            <ArrowUp size={14} />
                        </button>
                        <button 
                            onClick={() => onReorderFrame(frame.id, 'down')}
                            disabled={index === frames.length - 1}
                            className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30"
                        >
                            <ArrowDown size={14} />
                        </button>
                        <button 
                            onClick={() => onDeleteFrame(frame.id)}
                            className="p-1 hover:bg-red-900/50 rounded text-red-400"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Right: Preview Canvas */}
      <div className="flex-1 bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 overflow-auto flex justify-center items-start min-h-[400px]">
        {/* Hidden Canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {stitchedImage ? (
            <img src={stitchedImage} className="max-w-full shadow-2xl rounded border border-slate-600" alt="Stitched Result" />
        ) : (
            <div className="text-slate-500 flex items-center justify-center h-full">
                Waiting for frames...
            </div>
        )}
      </div>
    </div>
  );
};
