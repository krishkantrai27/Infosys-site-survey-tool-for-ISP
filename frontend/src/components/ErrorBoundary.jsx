import { Component } from 'react'
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    handleGoBack = () => {
        window.history.back()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '80vh', padding: 24
                }}>
                    <div style={{
                        textAlign: 'center', maxWidth: 440, padding: 40,
                        background: 'var(--color-surface, #fff)',
                        borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        border: '1px solid var(--color-border, #E2E8F0)'
                    }}>
                        <AlertTriangle size={48} color="#F59E0B" style={{ marginBottom: 16 }} />
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1E293B' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                            This page encountered an unexpected error. You can try again or go back.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={this.handleGoBack}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <ArrowLeft size={16} /> Go Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={this.handleRetry}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <RefreshCw size={16} /> Try Again
                            </button>
                        </div>
                        {this.state.error && (
                            <details style={{ marginTop: 20, textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', color: '#94A3B8', fontSize: 12 }}>
                                    Technical details
                                </summary>
                                <pre style={{
                                    marginTop: 8, padding: 12, background: '#F8FAFC',
                                    borderRadius: 8, fontSize: 11, color: '#DC2626',
                                    overflow: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap'
                                }}>
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
