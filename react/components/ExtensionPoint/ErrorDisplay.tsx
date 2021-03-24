import PropTypes from 'prop-types'
import React, { ErrorInfo, PureComponent } from 'react'
import {
  createSystem,
  ThemeProvider,
  Box,
  Grid,
  Button,
  Text,
  Flex,
} from '@vtex/admin-ui'

import internalServerErrorSrc from '../../assets/internalServerError.png'

interface Props {
  treePath?: string
  error?: Error
  errorInfo?: ErrorInfo | null
  operationIds?: string[]
}

interface State {
  errorDetails?: boolean
}

const content = {
  internalServerError: {
    src: internalServerErrorSrc,
    error: 'ERROR',
    headline: 'Sorry, something went wrong on our side',
    firstBodyText:
      'It seems that an internal error has occurred on our system. Please, try again, or refresh the page.',
    secondBodyText:
      'If the problem persists, access our Status Page or get in touch with our support.',
    button: 'REFRESH',
  },
}

class ErrorDisplay extends PureComponent<Props, State> {
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
    const { treePath, error, errorInfo, operationIds } = this.props
    const { errorDetails } = this.state

    const componentStack = errorInfo && errorInfo.componentStack

    const system = createSystem('render-runtime-error')
    const {
      src,
      error: errorContent,
      headline,
      firstBodyText,
      secondBodyText,
    } = content['internalServerError']

    return (
      <ThemeProvider system={system}>
        <Box
          csx={{
            bg: 'rgba(202, 215, 241, 0.24)',
            height: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Grid
            templateColumns="1fr"
            gap="32px"
            csx={{ gridTemplateColumns: '584px 284px' }}
          >
            <img
              style={{ margin: 'auto', objectFit: 'contain' }}
              src={src}
              alt={headline}
            />
            <Flex csx={{ padding: '5' }} direction="column" justify="center">
              <Text
                variant="action"
                csx={{
                  marginBottom: '1',
                  color: 'dark.secondary',
                  lineHeight: '18px',
                }}
              >
                {errorContent}
              </Text>
              <Text
                variant="headline"
                csx={{
                  marginBottom: '4',
                  color: 'dark.primary',
                  lineHeight: '24px',
                }}
              >
                {headline}
              </Text>
              <Text
                variant="body"
                csx={{
                  marginBottom: '3',
                  color: 'dark.secondary',
                  lineHeight: '20px',
                }}
              >
                {firstBodyText}
              </Text>
              <Text
                variant="body"
                csx={{
                  color: 'dark.secondary',
                  lineHeight: '20px',
                  a: {
                    color: 'blue',
                    textDecoration: 'none',
                  },
                  'a:hover': {
                    color: 'blue.hover',
                    textDecoration: 'underline',
                  },
                }}
              >
                {secondBodyText}
              </Text>

              <Button
                csx={{
                  marginTop: '5',
                  alignSelf: 'flex-start',
                  textTransform: 'uppercase',
                }}
                onClick={() => window.location.reload()}
              >
                {content['internalServerError'].button}
              </Button>
            </Flex>
          </Grid>
        </Box>
        <Box
          csx={{
            bg: 'rgba(202, 215, 241, 0.24)',
            minHeight: '30vh',
            padding: '0 ',
          }}
        >
          <Box
            csx={{
              display: 'flex',
              alignItems: 'top',
              justifyContent: 'center',
            }}
          >
            Error rendering extension point <strong>{treePath}</strong>
          </Box>
          <Box
            csx={{
              display: 'flex',
              alignItems: 'top',
              justifyContent: 'center',
              margin: '20px 0',
            }}
          >
            <Button
              variant="secondary"
              size="small"
              onClick={this.handleToggleErrorDetails}
            >
              ({errorDetails ? 'hide' : 'show'} details)
            </Button>
          </Box>

          {errorDetails && error && (
            <>
              <ul className="f6 list pl0">
                {operationIds &&
                  operationIds.map((operationId) => (
                    <li key={operationId}>
                      <span>Operation ID:</span>{' '}
                      <span className="i">{operationId}</span>
                    </li>
                  ))}
              </ul>
              <pre style={{ whiteSpace: 'pre-wrap', padding: '0 20px' }}>
                <code>{error.stack}</code>
              </pre>
            </>
          )}

          {errorDetails && componentStack && (
            <pre style={{ whiteSpace: 'pre-wrap', padding: '0 20px 20px' }}>
              <code>{componentStack}</code>
            </pre>
          )}
        </Box>
      </ThemeProvider>
    )
  }
}

export default ErrorDisplay
