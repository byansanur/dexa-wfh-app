import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--background, #f5f5f5)',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            padding: '40px',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid var(--border, #eaeaea)'
          }}>
            <h1 style={{ color: 'var(--error, #e53e3e)', marginBottom: '16px', fontSize: '24px' }}>
              Oops, Terjadi Kesalahan!
            </h1>
            <p style={{ color: 'var(--text-muted, #666)', marginBottom: '24px', lineHeight: '1.5' }}>
              Maaf, aplikasi mengalami masalah yang tidak terduga. Tim kami telah mencatat masalah ini.
              <br /><br />
              {this.state.error?.message && (
                <span style={{
                  display: 'inline-block',
                  background: '#fef2f2',
                  color: '#991b1b',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {this.state.error.message}
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button onClick={() => window.location.reload()} variant="primary">
                Muat Ulang Halaman
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="secondary">
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
