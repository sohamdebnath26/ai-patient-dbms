import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-base text-gray-600">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="bg-brand-600 hover:bg-brand-700 mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
