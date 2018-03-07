import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'

import {getImplementation} from '../utils/assets'

export default class ExtensionPointComponent extends PureComponent {
  static contextTypes = {
    emitter: PropTypes.object,
    extensions: PropTypes.object,
    treePath: PropTypes.string,
    fetchComponent: PropTypes.func,
  }

  static propTypes = {
    children: PropTypes.node,
    component: PropTypes.string,
    props: PropTypes.object,
  }

  constructor(props, context) {
    super(props, context)

    const root = context.treePath && context.treePath.split('/')[0]
    this.emptyExtensionPoint = context.extensions[`${root}/__empty`]
    this.editableExtensionPoint = context.extensions[`${root}/__editable`]
    this.state = {}
  }

  updateComponents = () => {
    if (!this._isMounted) {
      return false
    }

    this.setState({error: null, errorInfo: null, lastUpdate: Date.now()})
  }

  updateComponentsWithEvent = (component) => {
    if (!this._isMounted) {
      return false
    }

    this.emitBuildStatus('hmr:success')
    this.updateComponents()

    const {treePath} = this.context
    const {component: mounted} = this.props
    console.log(`[render] Component updated. treePath=${treePath} ${mounted !== component ? `mounted=${mounted} ` : ''}updated=${component}`)
  }

  emitBuildStatus = (status) => {
    const {emitter} = this.context
    emitter.emit('build.status', status)
  }

  fetchAndRerender = () => {
    const {fetchComponent} = this.context
    const {component} = this.props
    const Component = getImplementation(component)

    // Let's fetch the assets and re-render.
    if (component && !Component) {
      this.emitBuildStatus('start')
      fetchComponent(component)
      .then(this.updateComponentsWithEvent)
      .catch(() => {
        this.emitBuildStatus('fail')
      })
    }
  }

  subscribeToComponent = (c) => {
    const app = c && c.split('/')[0]
    if (global.__RENDER_7_HOT__[app]) {
      global.__RENDER_7_HOT__[app].addListener(`component:${c}:update`, this.updateComponentsWithEvent)
    }
  }

  unsubscribeToComponent = (c) => {
    const app = c && c.split('/')[0]
    if (global.__RENDER_7_HOT__[app]) {
      global.__RENDER_7_HOT__[app].removeListener(`component:${c}:update`, this.updateComponentsWithEvent)
    }
  }

  handleToggleErrorDetails = () => {
    this.setState({
      errorDetails: !this.state.errorDetails,
    })
  }

  renderError = () => {
    const {treePath} = this.context
    const {error, errorInfo, errorDetails} = this.state
    const componentStack = errorInfo && errorInfo.componentStack

    return (
      <div className="bg-washed-red pa6 f5 serious-black br3 pre">
        <span>Error rendering extension point <strong>{treePath}</strong></span>
        <button className="red ph0 ma0 mh3 bg-transparent bn pointer link" onClick={this.handleToggleErrorDetails}>({errorDetails ? 'hide' : 'show'} details)</button>
        {errorDetails && (
          <pre>
            <code className="f6">
              {error.stack}
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

  componentDidCatch(error, errorInfo) {
    console.error('Failed to render extension point', this.context.treePath)
    this.setState({
      error,
      errorInfo,
      errorDetails: false,
    })
  }

  componentDidMount() {
    this._isMounted = true
    const {component} = this.props
    this.subscribeToComponent(component)
    this.fetchAndRerender()

    if (this.emptyExtensionPoint && this.editableExtensionPoint) {
      this.subscribeToComponent(this.emptyExtensionPoint.component)
      this.subscribeToComponent(this.editableExtensionPoint.component)
    }
  }

  componentWillReceiveProps(nextProps) {
    const {component} = this.props
    const {component: nextComponent} = nextProps

    if (component !== nextComponent) {
      this.unsubscribeToComponent(component)
      this.subscribeToComponent(nextComponent)
      this.updateComponents()
    }
  }

  componentDidUpdate() {
    this.fetchAndRerender()
  }

  componentWillUnmount() {
    this._isMounted = false
    const {component} = this.props
    this.unsubscribeToComponent(component)

    if (this.emptyExtensionPoint && this.editableExtensionPoint) {
      this.unsubscribeToComponent(this.emptyExtensionPoint.component)
      this.unsubscribeToComponent(this.editableExtensionPoint.component)
    }
  }

  render() {
    const {treePath, production} = this.context
    const {component, props, children} = this.props
    const {error} = this.state
    const Component = getImplementation(component)

    // A children of this extension point throwed an uncaught error
    if (error) {
      return production ? null : this.renderError()
    }

    const EmptyExtensionPoint = this.emptyExtensionPoint && getImplementation(this.emptyExtensionPoint.component)
    const EditableExtensionPoint = this.editableExtensionPoint && getImplementation(this.editableExtensionPoint.component)

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
