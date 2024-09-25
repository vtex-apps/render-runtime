import React, { ErrorInfo, FunctionComponent } from 'react'
import ErrorDisplay from './ExtensionPoint/ErrorDisplay'
import { useRuntime } from './RenderContext'
import type { RenderContext } from './RenderContext'
import { isAdmin } from '../utils/isAdmin'
import { captureException } from '@sentry/react'
import { CustomAdminTags } from '../o11y/types'
import ErrorPage from './ErrorPage/ErrorPage'

interface Props {
  runtime: RenderContext
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

    if (!isAdmin()) return

    const tags: CustomAdminTags = {
      admin_render_runtime_page: 'ErrorBoundary',
    }

    captureException(this.state, { tags })
  }

  public render() {
    const { production } = this.props.runtime

    const { error, errorInfo } = this.state
    if (error) {
      console.log('Client side error')

      if (isAdmin()) {
        console.log('Is admin, production, new error page')
        return <ErrorPage />
      }

      if (!production) {
        console.log('Not production, old stack trace')
        return <ErrorDisplay error={error} errorInfo={errorInfo} />
      }

      console.log('Returned null')
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
