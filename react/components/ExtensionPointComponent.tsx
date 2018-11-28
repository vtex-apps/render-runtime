import * as Sentry from '@sentry/browser'
import PropTypes from 'prop-types'
import React, { ErrorInfo, PureComponent } from 'react'

import { getImplementation } from '../utils/assets'

import ExtensionPointError from './ExtensionPointError'
import Loading from './Loading'
import { RenderContextProps } from './RenderContext'

interface Props {
  component: string | null
  props: any
  treePath: string
}

interface State {
  error?: Error | null
  errorInfo?: ErrorInfo | null
  lastUpdate?: number
}

const componentPromiseMap: Record<string, Promise<boolean>> = {}

class ExtensionPointComponent extends PureComponent<
  Props & RenderContextProps,
  State
> {
  public static propTypes = {
    children: PropTypes.node,
    component: PropTypes.string,
    props: PropTypes.object,
    runtime: PropTypes.object,
    treePath: PropTypes.string,
  }

  // tslint:disable-next-line:variable-name
  private _isMounted!: boolean
  private mountedError!: boolean

  constructor(props: Props & RenderContextProps) {
    super(props)

    this.state = {}
    this.mountedError = false
  }

  public updateComponentsWithEvent = (component: string) => {
    if (!this._isMounted) {
      return false
    }

    this.setState({ error: null, errorInfo: null, lastUpdate: Date.now() })
    const { component: mounted, treePath } = this.props
    console.log(
      `[render] Component updated. treePath=${treePath} ${
        mounted !== component ? `mounted=${mounted} ` : ''
      }updated=${component}`
    )
  }

  public fetchAndRerender = () => {
    const {
      component,
      runtime: { fetchComponent },
    } = this.props
    const Component = component && getImplementation(component)

    // Let's fetch the assets and re-render.
    if (component && !Component) {
      if (!componentPromiseMap[component]) {
        componentPromiseMap[component] = fetchComponent(component)
      }
      componentPromiseMap[component].then(fetched => {
        if (!fetched) {
          throw new Error(`Scripts for '${component}' already added to page but no implementation registered`)
        }

        this.updateComponentsWithEvent(component)
      })
    }
  }

  public clearError = () => {
    this.setState({
      error: null,
      errorInfo: null,
    })
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const {
      component,
      props,
      runtime: {production, account, workspace},
      runtime,
      treePath: path,
    } = this.props
    const {children, __errorInstance, __clearError, ...componentProps} = props

    console.error('Failed to render extension point', path, component)
    // Only log 10 percent of the errors so we dont exceed our quota
    if (production && Math.random() < 0.1) {
      Sentry.configureScope(scope => {
        scope.setExtra('runtime', runtime)
        scope.setExtra('treePath', path)
        scope.setExtra('props', componentProps)

        scope.setTag('account', account)
        scope.setTag('workspace', workspace)
        scope.setTag('component', component || '')
      })
      Sentry.captureException(error)
    }

    this.setState({
      error,
      errorInfo,
    })
  }

  public componentDidMount() {
    this._isMounted = true
    this.fetchAndRerender()
  }

  public componentDidUpdate() {
    this.fetchAndRerender()
    if (this.state.error) {
      if (this.mountedError) {
        this.clearError()
      } else {
        this.mountedError = true
      }
    }
  }

  public componentWillUnmount() {
    this._isMounted = false
  }

  public render() {
    const {
      component,
      props,
      children,
      treePath,
      runtime: { production, pages, page },
    } = this.props
    const { error, errorInfo } = this.state
    const Component = component && getImplementation(component)

    // A children of this extension point throwed an uncaught error
    // Only show errors in production if the entire page explodes. (Ignore nested extension points)
    if (error) {
      if (production && !pages[treePath] && !page.startsWith('admin/')) {
        return null
      }

      const errorInstance = (
        <ExtensionPointError
          error={error}
          errorInfo={errorInfo!}
          treePath={treePath}
        />
      )
      props.__errorInstance = errorInstance
      props.__clearError = this.clearError

      if (!Component || !(Component as any).hotReload) {
        return errorInstance
      }
    } else {
      delete props.__errorInstance
      delete props.__clearError
    }

    return Component ? (
      <Component {...props}>{children}</Component>
    ) : (
      children || <Loading />
    )
  }
}

export default ExtensionPointComponent
