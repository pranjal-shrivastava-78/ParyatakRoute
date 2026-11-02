import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, PlusCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
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
    console.error('[ParyatakRoute ErrorBoundary] Caught render exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            backgroundColor: 'var(--color-bg-main, #F7F5EF)',
          }}
        >
          <div
            style={{
              maxWidth: 580,
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: 20,
              border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
              padding: 'clamp(24px, 5vw, 40px)',
              boxShadow: '0 8px 24px rgba(24, 61, 50, 0.06)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(217, 119, 69, 0.12)',
                color: 'var(--color-terracotta, #D97745)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
                fontWeight: 800,
                color: 'var(--color-primary, #183D32)',
                margin: '0 0 12px 0',
              }}
            >
              {this.props.fallbackTitle || 'Something Went Wrong Displaying This Page'}
            </h2>

            <p
              style={{
                fontSize: 14,
                color: 'var(--color-graphite, #53635B)',
                lineHeight: 1.6,
                margin: '0 0 24px 0',
              }}
            >
              {this.props.fallbackMessage ||
                this.state.error?.message ||
                'An unexpected rendering issue occurred. You can retry loading the page or return to the travel planner.'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 9999,
                  backgroundColor: 'var(--color-primary, #183D32)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} />
                <span>Try Again</span>
              </button>

              <a
                href="/create"
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 9999,
                  backgroundColor: 'transparent',
                  color: 'var(--color-primary, #183D32)',
                  border: '1.5px solid var(--color-primary, #183D32)',
                  textDecoration: 'none',
                }}
              >
                <PlusCircle size={15} />
                <span>Plan a New Trip</span>
              </a>

              <a
                href="/"
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 9999,
                  backgroundColor: 'transparent',
                  color: 'var(--color-graphite, #53635B)',
                  border: '1.5px solid var(--color-divider-gray, #D8D4C7)',
                  textDecoration: 'none',
                }}
              >
                <Home size={15} />
                <span>Return Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

