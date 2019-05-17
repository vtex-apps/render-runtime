import * as Sentry from '@sentry/browser'
import PropTypes from 'prop-types'
import { chain, pluck } from 'ramda'
import React, { ErrorInfo, PureComponent } from 'react'

import { getImplementation } from '../utils/assets'
import graphQLErrorsStore from '../utils/graphQLErrorsStore'

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
  operationIds: string[]
  lastUpdate?: number
}

const componentPromiseMap: any = {}
const componentPromiseResolvedMap: any = {}

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

  private _isMounted!: boolean
  private mountedError!: boolean

  public constructor(props: Props & RenderContextProps) {
    super(props)

    this.state = {
      operationIds: [],
    }
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

    return true
  }

  public fetchAndRerender = () => {
    const {
      component,
      runtime: { fetchComponent },
    } = this.props
    const Component = component && getImplementation(component)

    // Let's fetch the assets and re-render.
    if (component && !Component) {
      if (!(component in componentPromiseMap)) {
        componentPromiseMap[component] = fetchComponent(component)
      } else if (componentPromiseResolvedMap[component]) {
        throw new Error(`Unable to fetch component ${component}`)
      }

      componentPromiseMap[component]
        .then(() => {
          componentPromiseResolvedMap[component] = true
          this.updateComponentsWithEvent(component)
        })
        .catch(() => {
          componentPromiseResolvedMap[component] = true
        })
    }
  }

  public clearError = () => {
    this.setState({
      error: null,
      errorInfo: null,
      operationIds: []
    })
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const {
      component,
      props,
      runtime: { production, account, workspace },
      runtime,
      treePath: path,
    } = this.props
    const { children, __errorInstance, __clearError, ...componentProps } = props

    console.error('Failed to render extension point', path, component)

    const operationIds = graphQLErrorsStore.getOperationIds()

    // Only log 10 percent of the errors so we dont exceed our quota
    if (production && Math.random() < 0.1) {
      Sentry.configureScope(scope => {
        scope.setExtra('runtime', runtime)
        scope.setExtra('treePath', path)
        scope.setExtra('props', componentProps)
        scope.setExtra('operationIds', operationIds)

        scope.setTag('account', account)
        scope.setTag('workspace', workspace)
        scope.setTag('component', component || '')
        scope.setTag('domain', runtime.route.domain)
        scope.setTag('page', runtime.page)
      })
      Sentry.captureException(error)
    }

    this.setState({
      error,
      errorInfo,
      operationIds,
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
        // this.clearError()
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
    const { error, errorInfo, operationIds } = this.state
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
          errorInfo={errorInfo}
          operationIds={operationIds}
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
