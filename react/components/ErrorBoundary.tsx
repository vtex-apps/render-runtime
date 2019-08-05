import React, { ErrorInfo, FunctionComponent } from 'react'
import ExtensionPointError from './ExtensionPointError'
import { useRuntime } from './RenderContext'

interface Props {
  runtime: RenderContext
}

class ErrorBoundary extends React.Component<Props> {
  state = {
    error: undefined,
    errorInfo: undefined,
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    const {
      production
    } = this.props.runtime

    const { error, errorInfo } = this.state
    if (error) {
      if (!production) {
        return (
          <ExtensionPointError
            error={error}
            errorInfo={errorInfo}
          />
        )
      }
      return null
    }

    return this.props.children
  }
}

const ErrorBoundaryWithContext:FunctionComponent = ({children}) => {
  const runtime = useRuntime()

  return (
    <ErrorBoundary runtime={runtime}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundaryWithContext

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WithErrorBoundary = (props: P) => {
    const runtime = useRuntime()

    return (
      <ErrorBoundary runtime={runtime}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  const displayName = Component.displayName || Component.name

  if (displayName) {
    WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`
  }

  return WithErrorBoundary
}
