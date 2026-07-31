import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('A local UI error was contained.', error.name, info.componentStack) }
  render() {
    if (this.state.failed) return <main className="fatal"><h1>This view hit an unexpected problem</h1><p>Your saved local data has not been cleared. Reload the page to recover.</p><button onClick={() => location.reload()}>Reload application</button></main>
    return this.props.children
  }
}

