import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Bojana portal render error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f5f0', color: '#20231f', fontFamily: 'Arial, sans-serif' }}>
          <section style={{ maxWidth: 640, width: '100%', background: '#fff', border: '1px solid #dedbd2', borderRadius: 20, padding: 28, boxShadow: '0 12px 32px rgba(0,0,0,.08)' }}>
            <p style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#687266', fontWeight: 700 }}>Bojana Estudio</p>
            <h1 style={{ fontSize: 28, fontWeight: 500, margin: '10px 0' }}>No pudimos cargar esta vista</h1>
            <p style={{ color: '#687266', lineHeight: 1.5 }}>El proyecto tiene un dato que necesita ser actualizado. Recargá la página para continuar.</p>
            <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 18, border: 0, borderRadius: 999, padding: '12px 20px', background: '#20231f', color: '#fff', cursor: 'pointer' }}>Recargar portal</button>
            <details style={{ marginTop: 20, color: '#687266', fontSize: 12 }}><summary>Ver detalle técnico</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre></details>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)
