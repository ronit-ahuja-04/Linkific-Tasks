import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './ui/ErrorState';

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
        <ErrorState
          variant="panel"
          code="ROUTE_BOUNDARY_ERROR"
          title="Quest Scene Interrupted"
          message={this.state.message}
          actionLabel="Reload Quest Screen"
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}
