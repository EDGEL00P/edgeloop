/**
 * EDGELOOP ERROR BOUNDARY - 2027 Modern Error Handling
 * Using React Error Boundary with modern patterns
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Edgeloop Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-nfl-dark flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-3d p-8 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF4D00]/10 mb-4"
            >
              <AlertTriangle className="w-8 h-8 text-[#FF4D00]" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">System Error</h2>
            <p className="text-white/60 mb-6">
              Edgeloop encountered an unexpected error. The system has been stabilized.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-white/50 cursor-pointer mb-2">
                  Technical Details
                </summary>
                <div className="p-3 bg-white/5 rounded-lg font-mono text-xs text-white/70 overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-[10px]">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={this.handleReset}
              className="btn-3d w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Restart System
            </motion.button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
