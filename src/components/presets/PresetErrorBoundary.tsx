import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  presetName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PresetErrorBoundary extends (React.Component as any) {
  public state: any = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PresetErrorBoundary] Error in ${this.props.presetName}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-slate-900 text-red-400 flex flex-col items-center justify-center p-6 pointer-events-none">
          <div className="bg-slate-950/80 p-6 rounded-xl border border-red-900/50 max-w-md backdrop-blur-md pointer-events-auto text-center">
            <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
              ⚠️ Failed to load {this.props.presetName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              A runtime error occurred during WebGL compilation or state lifecycle management.
            </p>
            <div className="bg-black/40 p-3 rounded text-left font-mono text-[10px] overflow-x-auto mb-4 max-h-32 custom-scrollbar">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1.5 bg-red-950 text-red-200 text-xs rounded-md border border-red-800/50 hover:bg-red-900 transition-colors"
            >
              Attempt Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
