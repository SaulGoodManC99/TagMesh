import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in TagMesh React App:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center p-6 text-neutral-800 font-sans">
          <div className="max-w-md w-full p-8 rounded-[36px] bg-white clay-card border-4 border-white shadow-2xl text-center">
            <div className="text-5xl mb-4 select-none">🎈</div>
            <h2 className="font-bubble text-2xl font-bold text-neutral-900 mb-2">
              哎呀，黏土稍微碰到了一点小插曲
            </h2>
            <p className="font-cute text-sm text-neutral-600 mb-6 leading-relaxed">
              系统已安全保护你的笔记数据。点击下方按钮即可一键刷新并恢复乐园视图！
            </p>
            {this.state.error && (
              <pre className="p-3 mb-6 rounded-2xl bg-neutral-100 text-rose-600 font-mono text-xs overflow-x-auto text-left border border-neutral-200">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bubble text-sm font-bold clay-btn shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新并恢复乐园</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
