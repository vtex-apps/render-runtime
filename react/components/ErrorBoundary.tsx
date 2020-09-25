import React, { ErrorInfo, FunctionComponent } from 'react'
import ErrorDisplay from './ExtensionPoint/ErrorDisplay'
import { useRuntime, RenderContextType } from './RenderContext'

interface Props {
  runtime: RenderContextType
}

class ErrorBoundary extends React.Component<Props> {
  public state = {
    error: undefined,
    errorInfo: undefined,
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })
  }

  public render() {
    const { production } = this.props.runtime

    const { error, errorInfo } = this.state
    if (error) {
      if (!production) {
        return <ErrorDisplay error={error} errorInfo={errorInfo} />
      }
      return null
    }

    return this.props.children
  }
}

const ErrorBoundaryWithContext: FunctionComponent = ({ children }) => {
  const runtime = useRuntime()

  return <ErrorBoundary runtime={runtime}>{children}</ErrorBoundary>
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
