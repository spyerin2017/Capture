import React, { useState } from 'react';
import { CaptureStage } from './components/CaptureStage';
import { StitchEditor } from './components/StitchEditor';
import { Button } from './components/Button';
import { AppState, CapturedFrame, AnalysisResult } from './types';
import { analyzeScreenshot } from './services/geminiService';
import { Scan, Scissors, Bot, Layout, Loader2, ArrowLeft, X } from 'lucide-react';

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartCapture = () => {
    setFrames([]);
    setAnalysis(null);
    setAppState(AppState.CAPTURING);
  };

  const handleCaptureComplete = (capturedFrames: CapturedFrame[]) => {
    setFrames(capturedFrames);
    setAppState(AppState.STITCHING);
  };

  const handleAnalyze = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeScreenshot(imageDataUrl);
      setAnalysis(result);
    } catch (error) {
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteFrame = (id: string) => {
    setFrames(prev => prev.filter(f => f.id !== id));
  };

  const handleReorderFrame = (id: string, direction: 'up' | 'down') => {
    setFrames(prev => {
        const idx = prev.findIndex(f => f.id === id);
        if (idx === -1) return prev;
        
        const newFrames = [...prev];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        
        if (swapIdx >= 0 && swapIdx < newFrames.length) {
            [newFrames[idx], newFrames[swapIdx]] = [newFrames[swapIdx], newFrames[idx]];
        }
        return newFrames;
    });
  };

  // Render Logic
  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col text-slate-100 overflow-hidden">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900 shadow-md z-50">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
                <Scan className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                SnapStream AI
            </h1>
        </div>
        {appState !== AppState.IDLE && (
            <Button variant="ghost" size="sm" onClick={() => setAppState(AppState.IDLE)} icon={<ArrowLeft size={16}/>}>
                Back to Home
            </Button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        
        {/* IDLE STATE: Dashboard */}
        {appState === AppState.IDLE && (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
                
                <div className="relative z-10 max-w-2xl text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white tracking-tight">
                        Capture. Stitch. <span className="text-indigo-400">Analyze.</span>
                    </h2>
                    <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                        The ultimate tool for rolling screenshots on Windows. Capture long conversations, code, or webpages instantly, then extract insights with Gemini AI.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur hover:bg-slate-800 transition-colors">
                            <Scissors className="mx-auto mb-4 text-pink-400" size={32} />
                            <h3 className="font-semibold mb-2">Long Stitching</h3>
                            <p className="text-sm text-slate-400">Auto-stitch multiple screenshots into one seamless long image.</p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur hover:bg-slate-800 transition-colors">
                            <Layout className="mx-auto mb-4 text-cyan-400" size={32} />
                            <p className="font-semibold mb-2">Any Window</p>
                            <p className="text-sm text-slate-400">Works on any Windows application via browser stream sharing.</p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur hover:bg-slate-800 transition-colors">
                            <Bot className="mx-auto mb-4 text-indigo-400" size={32} />
                            <h3 className="font-semibold mb-2">AI Powered</h3>
                            <p className="text-sm text-slate-400">Extract text, code, or summaries using Gemini 2.5 Flash.</p>
                        </div>
                    </div>

                    <Button size="lg" onClick={handleStartCapture} className="shadow-xl shadow-indigo-900/20 text-lg px-8 py-4">
                        Start Capture
                    </Button>
                </div>
            </div>
        )}

        {/* CAPTURE STATE */}
        {appState === AppState.CAPTURING && (
            <CaptureStage 
                onCaptureFrames={handleCaptureComplete} 
                onCancel={() => setAppState(AppState.IDLE)} 
            />
        )}

        {/* STITCHING & EDITING STATE */}
        {appState === AppState.STITCHING && (
            <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden relative">
                    <StitchEditor 
                        frames={frames}
                        onDeleteFrame={handleDeleteFrame}
                        onReorderFrame={handleReorderFrame}
                        onAnalyze={handleAnalyze}
                        onReset={handleStartCapture}
                    />
                    
                    {/* Analysis Overlay/Modal */}
                    {(isAnalyzing || analysis) && (
                        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-end">
                            <div className="w-full md:w-[450px] bg-slate-900 border-l border-slate-700 p-6 shadow-2xl overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                                        <Bot size={24}/> AI Analysis
                                    </h3>
                                    <button onClick={() => {setAnalysis(null); setIsAnalyzing(false)}} className="p-2 hover:bg-slate-800 rounded-full">
                                        <X className="text-slate-400" size={20}/>
                                    </button>
                                </div>

                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                                        <Loader2 className="animate-spin text-indigo-500" size={48} />
                                        <p>Gemini is reading your screen...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                        {analysis?.summary && (
                                            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                                <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Summary</h4>
                                                <p className="text-slate-300 leading-relaxed text-sm">
                                                    {analysis.summary}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {analysis?.text && (
                                            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                                <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Extracted Text</h4>
                                                <p className="text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto bg-slate-900 p-2 rounded">
                                                    {analysis.text}
                                                </p>
                                            </div>
                                        )}

                                        {analysis?.code && (
                                            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                                <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Code Detected</h4>
                                                <pre className="text-xs text-green-400 font-mono bg-slate-950 p-3 rounded overflow-x-auto border border-slate-800">
                                                    {analysis.code}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;