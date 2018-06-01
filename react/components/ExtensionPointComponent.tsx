import PropTypes from 'prop-types'
import React, {ErrorInfo, PureComponent, ReactElement} from 'react'

import {getImplementation} from '../utils/assets'
import logEvent from '../utils/logger'

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
    account: PropTypes.string,
    emitter: PropTypes.object,
    extensions: PropTypes.object,
    fetchComponent: PropTypes.func,
    treePath: PropTypes.string,
    workspace: PropTypes.string
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

  public updateComponentsWithEvent = (component: string) => {
    if (!this._isMounted) {
      return false
    }

    this.setState({error: null, errorInfo: null, lastUpdate: Date.now()})
    const {treePath} = this.context
    const {component: mounted} = this.props
    console.log(`[render] Component updated. treePath=${treePath} ${mounted !== component ? `mounted=${mounted} ` : ''}updated=${component}`)
  }

  public fetchAndRerender = () => {
    const {fetchComponent, emitter} = this.context
    const {component} = this.props
    const Component = component && getImplementation(component)

    // Let's fetch the assets and re-render.
    if (component && !Component && !componentPromiseMap[component]) {
      componentPromiseMap[component] = fetchComponent(component)
      .then(this.updateComponentsWithEvent)
    }
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
    const {account, treePath: path, workspace} = this.context
    const {message, stack} = error
    const {componentStack} = errorInfo
    const event = {
      data: {
        account,
        componentStack,
        message,
        path,
        stack,
        workspace
      },
      name: 'JSError'
    }

    console.error('Failed to render extension point', path)
    logEvent(event)

    this.setState({
      error,
      errorDetails: false,
      errorInfo,
    })
  }

  public componentDidMount() {
    this._isMounted = true
    this.fetchAndRerender()
  }

  public componentDidUpdate() {
    this.fetchAndRerender()
  }

  public componentWillUnmount() {
    this._isMounted = false
  }

  public handleToggleErrorDetails = () => {
    this.setState({
      errorDetails: !this.state.errorDetails,
    })
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

    const isEditable = Component && (Component.hasOwnProperty('schema') || Component.hasOwnProperty('getSchema'))
    const configuredComponent = Component ? <Component {...props}>{children}</Component> : children || null
    return this.editableExtensionPoint && isEditable
      ? <EditableExtensionPoint treePath={treePath} component={component} props={props}>{configuredComponent}</EditableExtensionPoint>
      : configuredComponent
  }
}

interface EditableExtensionPointProps {
  treePath: string
  component: string | null
  props?: any
}
