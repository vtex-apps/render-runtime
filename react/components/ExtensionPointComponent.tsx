import ReactDOM from 'react-dom'
import React, { ErrorInfo, PureComponent } from 'react'

import { getImplementation } from '../utils/assets'
import graphQLErrorsStore from '../utils/graphQLErrorsStore'

import ExtensionPointError from './ExtensionPointError'
import GenericPreview from './Preview/GenericPreview'
import { withLoading } from './LoadingContext'
import { RenderContextProps } from './RenderContext'
import { TreePathContextProvider } from '../utils/treePath'
import { isSiteEditorIframe } from '../utils/dom'
import { Loading } from '../core/main'
import StaticStrategyParent from './StaticStrategyParent'

interface Props {
  component: string | null
  props: any
  treePath: string
  setLoading?: (treePath: string, value: boolean) => void
  staticStrategy: StaticStrategy
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
        this.stopLoading()
        throw new Error(`Unable to fetch component ${component}`)
      }

      componentPromiseMap[component]
        .then(() => {
          componentPromiseResolvedMap[component] = true
          this.updateComponentsWithEvent(component)
          this.stopLoading()
        })
        .catch(() => {
          componentPromiseResolvedMap[component] = true
          this.stopLoading()
        })
    } else {
      this.stopLoading()
    }
  }

  private stopLoading = () => {
    if (this.props.setLoading) {
      this.props.setLoading(this.props.treePath, false)
    }
  }

  private startLoading = () => {
    if (this.props.setLoading) {
      this.props.setLoading(this.props.treePath, true)
    }
  }

  public clearError = () => {
    this.setState({
      error: null,
      errorInfo: null,
      operationIds: [],
    })
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { component, treePath: path } = this.props

    console.error('Failed to render extension point', path, component)
    const operationIds = graphQLErrorsStore.getOperationIds()

    this.setState({
      error,
      errorInfo,
      operationIds,
    })
  }

  public componentDidMount() {
    this._isMounted = true
    this.startLoading()
    this.fetchAndRerender()
    this.addDataToElementIfEditable()
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
    this.addDataToElementIfEditable()
  }

  public componentWillUnmount() {
    this.removeDataFromElement()
    this._isMounted = false
  }

  public render() {
    const {
      component,
      props,
      children,
      treePath,
      runtime: { production, page },
      props: componentProps,
      staticStrategy,
    } = this.props
    const { error, errorInfo, operationIds } = this.state
    const Component = component && getImplementation(component)

    // A children of this extension point throwed an uncaught error
    // Only show errors in production if the entire page explodes. (Ignore nested extension points)
    if (error) {
      if (production && !page.startsWith('admin/')) {
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

    const isRootTreePath = treePath.indexOf('/') === -1
    const isAround = treePath.indexOf('$around') !== -1

    return (
      <TreePathContextProvider treePath={treePath}>
        {Component ? (
          <StaticStrategyParent staticStrategy={staticStrategy}>
            <Component {...props}>{children}</Component>
          </StaticStrategyParent>
        ) : isRootTreePath || isAround ? (
          /* Adds header/footer before and after the preview during loading,
           * if the component being loaded is a root component--e.g. context
           * wrappers, `around` wrappers */
          <>
            {componentProps.beforeElements}
            <GenericPreview />
            {componentProps.afterElements}
          </>
        ) : (
          <Loading />
        )}
      </TreePathContextProvider>
    )
  }

  private addDataToElementIfEditable = () => {
    if (!isSiteEditorIframe) {
      return
    }
    const ComponentImpl =
      this.props.component && getImplementation(this.props.component)
    const isEditable =
      ComponentImpl &&
      (ComponentImpl.hasOwnProperty('schema') ||
        ComponentImpl.hasOwnProperty('getSchema'))

    if (!isEditable) {
      return
    }

    // eslint-disable-next-line react/no-find-dom-node
    const element = ReactDOM.findDOMNode(this) as Element

    if (element && element.setAttribute) {
      element.setAttribute('data-extension-point', this.props.treePath)
    }
  }

  private removeDataFromElement = () => {
    if (!isSiteEditorIframe) {
      return
    }
    // eslint-disable-next-line react/no-find-dom-node
    const element = ReactDOM.findDOMNode(this) as Element

    if (element && element.removeAttribute) {
      element.removeAttribute('data-extension-point')
    }
  }
}

/** TODO: withLoading is in the end a makeshift Suspense
 * wrapper. Should probably be replaced in the future. */
export default withLoading(ExtensionPointComponent)
