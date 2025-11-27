import React, { useEffect, useRef, useState } from 'react';
import { Camera, StopCircle, Clock, MousePointerClick, X } from 'lucide-react';
import { Button } from './Button';
import { CapturedFrame, CaptureMode } from '../types';
import { v4 as uuidv4 } from 'uuid'; // We'll implement a simple ID generator instead of importing uuid to save deps

const generateId = () => Math.random().toString(36).substr(2, 9);

interface CaptureStageProps {
  onCaptureFrames: (frames: CapturedFrame[]) => void;
  onCancel: () => void;
}

export const CaptureStage: React.FC<CaptureStageProps> = ({ onCaptureFrames, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mode, setMode] = useState<CaptureMode>(CaptureMode.SINGLE);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);

  // Initialize stream
  useEffect(() => {
    const startCapture = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" } as any,
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        // Handle stream stop (user clicks "Stop sharing" in browser UI)
        mediaStream.getVideoTracks()[0].onended = () => {
           // We might want to auto-finish if recording, but let's just let user decide
           stopStream();
        };

      } catch (err) {
        console.error("Error starting screen capture:", err);
        onCancel();
      }
    };

    if (!stream) {
      startCapture();
    }

    return () => {
      // Cleanup happens in stopStream or unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStream = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
    if (timerInterval) {
        window.clearInterval(timerInterval);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      
      const newFrame: CapturedFrame = {
        id: generateId(),
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now()
      };

      setFrames(prev => [...prev, newFrame]);
      
      // Visual feedback (flash effect could go here)
    }
  };

  // Timer logic for Long Screenshot (Timer Mode)
  useEffect(() => {
    if (mode === CaptureMode.LONG_TIMER && isRecording) {
      const id = window.setInterval(() => {
        captureFrame();
      }, 2000); // Capture every 2 seconds
      setTimerInterval(id);
      return () => window.clearInterval(id);
    } else {
        if (timerInterval) window.clearInterval(timerInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isRecording]);

  const handleFinish = () => {
    stopStream();
    onCaptureFrames(frames);
  };

  if (!stream) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
            <p>Initializing screen capture...</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
        <div className="flex gap-2">
            <button 
                onClick={() => setMode(CaptureMode.SINGLE)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === CaptureMode.SINGLE ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}
            >
                Standard
            </button>
            <button 
                onClick={() => setMode(CaptureMode.LONG_MANUAL)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === CaptureMode.LONG_MANUAL ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}
            >
                Long (Manual)
            </button>
            <button 
                onClick={() => setMode(CaptureMode.LONG_TIMER)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === CaptureMode.LONG_TIMER ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}
            >
                Long (Timer)
            </button>
        </div>
        <button onClick={() => { stopStream(); onCancel(); }} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-red-600/80 transition-colors">
            <X size={20} />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-slate-900">
        <video 
            ref={videoRef} 
            autoPlay 
            muted 
            className="max-w-full max-h-full object-contain shadow-2xl"
        />
      </div>

      {/* Bottom Controls */}
      <div className="h-24 bg-slate-900 border-t border-slate-700 flex items-center justify-center gap-8 px-8">
        <div className="flex flex-col items-center">
            <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Frames</span>
            <span className="text-2xl font-bold text-white font-mono">{frames.length}</span>
        </div>

        {mode === CaptureMode.SINGLE && (
            <Button size="lg" onClick={() => { captureFrame(); setTimeout(() => handleFinish(), 200); }} icon={<Camera />}>
                Capture & Edit
            </Button>
        )}

        {mode === CaptureMode.LONG_MANUAL && (
            <div className="flex gap-4">
                <Button variant="secondary" onClick={captureFrame} icon={<MousePointerClick />}>
                    Snap Frame
                </Button>
                <Button variant={frames.length > 0 ? 'primary' : 'ghost'} onClick={handleFinish} disabled={frames.length === 0}>
                    Finish Stitching
                </Button>
            </div>
        )}

        {mode === CaptureMode.LONG_TIMER && (
            <div className="flex gap-4">
                 {!isRecording ? (
                    <Button variant="danger" onClick={() => setIsRecording(true)} icon={<Clock />}>
                        Start Timer
                    </Button>
                 ) : (
                    <Button variant="secondary" onClick={() => setIsRecording(false)} icon={<StopCircle />} className="animate-pulse border-red-500 border">
                        Pause Timer
                    </Button>
                 )}
                 <Button variant={frames.length > 0 ? 'primary' : 'ghost'} onClick={handleFinish} disabled={frames.length === 0}>
                    Finish Stitching
                </Button>
            </div>
        )}
      </div>
      
      {/* Toast/Instructions Overlay */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm pointer-events-none">
        {mode === CaptureMode.SINGLE && "Position the window and click capture."}
        {mode === CaptureMode.LONG_MANUAL && "Scroll the target window manually, then click 'Snap Frame' repeatedly."}
        {mode === CaptureMode.LONG_TIMER && "Click Start. We'll snap every 2s while you scroll slowly."}
      </div>

    </div>
  );
};