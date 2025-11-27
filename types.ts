export interface CapturedFrame {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: number;
}

export enum CaptureMode {
  SINGLE = 'SINGLE',
  LONG_MANUAL = 'LONG_MANUAL',
  LONG_TIMER = 'LONG_TIMER'
}

export enum AppState {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  STITCHING = 'STITCHING',
  ANALYZING = 'ANALYZING'
}

export interface AnalysisResult {
  text?: string;
  summary?: string;
  code?: string;
}
