import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, message: error.message || 'Unexpected UI error' };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('SkillForge route boundary caught error:', error, info);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section className="rpg-card mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Quest Scene Interrupted</h1>
          <p className="mt-2 text-sm text-muted">{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rpg-btn-primary mt-5 rounded-xl px-5 py-2.5 text-sm font-bold"
          >
            Reload Quest Screen
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
