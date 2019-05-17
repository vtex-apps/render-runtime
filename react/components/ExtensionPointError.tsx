import PropTypes from 'prop-types'
import React, { ErrorInfo, PureComponent } from 'react'

interface Props {
  treePath: string
  error?: Error
  errorInfo?: ErrorInfo | null
}

interface State {
  errorDetails?: boolean
}

class ExtensionPointError extends PureComponent<Props, State> {
  public static propTypes = {
    error: PropTypes.object,
    errorInfo: PropTypes.object,
    treePath: PropTypes.string,
  }

  public constructor(props: any) {
    super(props)
    this.state = {}
  }

  public handleToggleErrorDetails = () => {
    this.setState({
      errorDetails: !this.state.errorDetails,
    })
  }

  public render() {
    const { treePath, error, errorInfo } = this.props
    const { errorDetails } = this.state
    const componentStack = errorInfo && errorInfo.componentStack

    return (
      <div className="bg-washed-red pa6 f5 serious-black br3 pre">
        <span>
          Error rendering extension point <strong>{treePath}</strong>
        </span>
        <button
          type="button"
          className="red ph0 ma0 mh3 bg-transparent bn pointer link"
          onClick={this.handleToggleErrorDetails}
        >
          ({errorDetails ? 'hide' : 'show'} details)
        </button>
        {errorDetails && error && (
          <>
            <ul className="f6 list pl0">
              {window && window.graphQLErrors && window.graphQLErrors[0] ? window.graphQLErrors[0].map(
                (graphQLError) => (
                  <li key={graphQLError.operationId}>
                    <span>Operation ID:</span> <span className="i">{graphQLError.operationId}</span>
                  </li>
                )
              ) : null}
            </ul>
          <pre>
            <code className="f6">{error.stack}</code>
          </pre>
          </>
        )}
        {errorDetails && componentStack && (
          <pre>
            <code className="f6">{componentStack}</code>
          </pre>
        )}
      </div>
    )
  }
}

export default ExtensionPointError
