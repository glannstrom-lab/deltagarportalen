import { Component, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Forwarded for grid placement parity with the failed widget */
  className?: string
}

interface State {
  hasError: boolean
}

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Widget error:', error)
  }

  handleRetry = () => this.setState({ hasError: false })

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        role="alert"
        className={[
          'bg-[var(--surface)] border border-[var(--stone-150)] rounded-[12px]',
          'p-[14px_16px] flex flex-col items-center justify-center gap-[8px]',
          this.props.className ?? '',
        ].join(' ')}
      >
        <AlertCircle size={16} className="text-[var(--stone-500)]" aria-hidden="true" />
        <h3 className="text-[13px] font-bold text-[var(--stone-700)] m-0">
          Kunde inte ladda
        </h3>
        <p className="text-[12px] font-normal text-[var(--stone-500)] m-0 text-center">
          Försök igen om en stund
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="text-[12px] font-bold text-[var(--c-text)] bg-transparent border-0 cursor-pointer underline-offset-2 hover:underline"
        >
          Försök igen
        </button>
      </div>
    )
  }
}
