import PropTypes from 'prop-types'
import React, {ErrorInfo, PureComponent, ReactElement} from 'react'

import {getImplementation} from '../utils/assets'

interface Props {
  component: string | null
  props: any
}

interface State {
  error?: Error | null
  errorInfo?: ErrorInfo | null
  errorDetails?: boolean
  lastUpdate?: number
}

const componentPromiseMap: any = {}

export default class ExtensionPointComponent extends PureComponent<Props, State> {
  public static contextTypes = {
    emitter: PropTypes.object,
    extensions: PropTypes.object,
    fetchComponent: PropTypes.func,
    treePath: PropTypes.string,
  }

  public static propTypes = {
    children: PropTypes.node,
    component: PropTypes.string,
    props: PropTypes.object,
  }

  public context!: RenderContext
  // tslint:disable-next-line:variable-name
  private _isMounted!: boolean
  private emptyExtensionPoint: Extension
  private editableExtensionPoint: Extension

  constructor(props: Props, context: RenderContext) {
    super(props, context)

    const root = context.treePath && context.treePath.split('/')[0]
    this.emptyExtensionPoint = context.extensions[`${root}/__empty`]
    this.editableExtensionPoint = context.extensions[`${root}/__editable`]
    this.state = {}
  }

  public updateComponents = () => {
    if (!this._isMounted) {
      return false
    }

    this.setState({error: null, errorInfo: null, lastUpdate: Date.now()})
  }

  public updateComponentsWithEvent = (component: string) => {
    if (!this._isMounted) {
      return false
    }

    this.emitBuildStatus('hmr:success')
    this.updateComponents()

    const {treePath} = this.context
    const {component: mounted} = this.props
    console.log(`[render] Component updated. treePath=${treePath} ${mounted !== component ? `mounted=${mounted} ` : ''}updated=${component}`)
  }

  public emitBuildStatus = (status: string) => {
    const {emitter} = this.context
    emitter.emit('build.status', status)
  }

  public fetchAndRerender = () => {
    const {fetchComponent} = this.context
    const {component} = this.props
    const Component = component && getImplementation(component)

    // Let's fetch the assets and re-render.
    if (component && !Component && !componentPromiseMap[component]) {
      this.emitBuildStatus('start')
      componentPromiseMap[component] = fetchComponent(component)
      .then(this.updateComponentsWithEvent)
      .catch(() => {
        this.emitBuildStatus('fail')
      })
    }
  }

  public subscribeToComponent = (c: string | null) => {
    const app = c && c.split('/')[0]
    if (app && global.__RENDER_7_HOT__[app]) {
      global.__RENDER_7_HOT__[app].addListener(`component:${c}:update`, this.updateComponentsWithEvent)
    }
  }

  public unsubscribeToComponent = (c: string | null) => {
    const app = c && c.split('/')[0]
    if (app && global.__RENDER_7_HOT__[app]) {
      global.__RENDER_7_HOT__[app].removeListener(`component:${c}:update`, this.updateComponentsWithEvent)
    }
  }

  public handleToggleErrorDetails = () => {
    this.setState({
      errorDetails: !this.state.errorDetails,
    })
  }

  public renderError = () => {
    const {treePath} = this.context
    const {error, errorInfo, errorDetails} = this.state
    const componentStack = errorInfo && errorInfo.componentStack

    return (
      <div className="bg-washed-red pa6 f5 serious-black br3 pre">
        <span>Error rendering extension point <strong>{treePath}</strong></span>
        <button type="button" className="red ph0 ma0 mh3 bg-transparent bn pointer link" onClick={this.handleToggleErrorDetails}>({errorDetails ? 'hide' : 'show'} details)</button>
        {errorDetails && (
          <pre>
            <code className="f6">
              {error!.stack}
            </code>
          </pre>
        )}
        {errorDetails && componentStack && (
          <pre>
            <code className="f6">
              {componentStack}
            </code>
          </pre>
        )}
      </div>
    )
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Failed to render extension point', this.context.treePath)
    this.setState({
      error,
      errorDetails: false,
      errorInfo,
    })
  }

  public componentDidMount() {
    this._isMounted = true
    const {component} = this.props
    this.subscribeToComponent(component)
    this.fetchAndRerender()

    if (this.emptyExtensionPoint && this.editableExtensionPoint) {
      this.subscribeToComponent(this.emptyExtensionPoint.component)
      this.subscribeToComponent(this.editableExtensionPoint.component)
    }
  }

  public componentWillReceiveProps(nextProps: Props) {
    const {component} = this.props
    const {component: nextComponent} = nextProps

    if (component !== nextComponent) {
      this.unsubscribeToComponent(component)
      this.subscribeToComponent(nextComponent)
      this.updateComponents()
    }
  }

  public componentDidUpdate() {
    this.fetchAndRerender()
  }

  public componentWillUnmount() {
    this._isMounted = false
    const {component} = this.props
    this.unsubscribeToComponent(component)

    if (this.emptyExtensionPoint && this.editableExtensionPoint) {
      this.unsubscribeToComponent(this.emptyExtensionPoint.component)
      this.unsubscribeToComponent(this.editableExtensionPoint.component)
    }
  }

  public render() {
    const {treePath, production} = this.context
    const {component, props, children} = this.props
    const {error} = this.state
    const Component = component && getImplementation(component)

    // A children of this extension point throwed an uncaught error
    if (error) {
      return production ? null : this.renderError()
    }

    const EmptyExtensionPoint = this.emptyExtensionPoint && getImplementation(this.emptyExtensionPoint.component)
    const EditableExtensionPoint = this.editableExtensionPoint && getImplementation<EditableExtensionPointProps>(this.editableExtensionPoint.component)

    // This extension point is not configured.
    if (!component && !production && this.emptyExtensionPoint) {
      return <EditableExtensionPoint treePath={treePath} component={this.emptyExtensionPoint.component}><EmptyExtensionPoint /></EditableExtensionPoint>
    }

    const configuredComponent = Component ? <Component {...props}>{children}</Component> : children || null
    return this.editableExtensionPoint
      ? <EditableExtensionPoint treePath={treePath} component={component} props={props}>{configuredComponent}</EditableExtensionPoint>
      : configuredComponent
  }
}

interface EditableExtensionPointProps {
  treePath: string
  component: string | null
  props?: any
}
