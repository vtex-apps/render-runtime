import React, {Component} from 'react'
import PropTypes from 'prop-types'
import treePath from 'react-tree-path'

import {fetchAssets, getComponents, getImplementations} from './utils/assets'

class ExtensionPoint extends Component {
  static contextTypes = {
    components: PropTypes.object,
    extensions: PropTypes.object,
    emitter: PropTypes.object,
    production: PropTypes.bool,
  }

  static propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node,
    treePath: PropTypes.string,
  }

  constructor(props, context) {
    super()
    this.state = this.getExtensionPointState(props, context)
  }

  getExtensionPointState = (props, context) => {
    const {treePath} = props
    const {extensions} = context
    const extension = extensions[treePath]
    return {
      extension,
    }
  }

  updateExtensionPoint = () => {
    this.setState(this.getExtensionPointState(this.props, this.context))
  }

  subscribe = (subscribe) => {
    const {production, emitter} = this.context
    const {extension} = this.state
    const {treePath} = this.props

    if (production) {
      return
    }

    const events = [
      'extension:*:update',
      `extension:${treePath}:update`,
    ]

    if (extension.component) {
      const originalComponent = Array.isArray(extension.component) ? extension.component[0] : extension.component
      events.push(`component:${originalComponent}:update`)
    }

    events.forEach(e => {
      if (subscribe) {
        emitter.addListener(e, this.updateExtensionPoint)
      } else {
        emitter.removeListener(e, this.updateExtensionPoint)
      }
    })
  }

  fetchComponentAndSubscribe = () => {
    const {components: componentAssets} = this.context
    const {extension} = this.state
    const components = getComponents(extension)
    const Components = getImplementations(components)

    // If this component is not loaded, fetch the assets and re-render
    if (extension &&
        extension.component &&
        !Components.length !== components.length) {
      fetchAssets(extension, componentAssets).then(this.updateExtensionPoint)
    }

    this.subscribe(true)
  }

  componentDidMount() {
    this.fetchComponentAndSubscribe()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.treePath !== this.props.treePath) {
      this.fetchComponentAndSubscribe()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.treePath !== this.props.treePath) {
      this.subscribe(false)
      this.setState(this.getExtensionPointState(nextProps, this.context))
    }
  }

  componentWillUnmount() {
    this.subscribe(false)
  }

  componentDidCatch(error, errorInfo) {
    console.error('Failed to render extension point', this.props.treePath, error, errorInfo)
    this.setState({
      ...this.state,
      error,
      errorInfo,
    })
  }

  render() {
    const {children, treePath, ...parentProps} = this.props
    const {extension, error, errorInfo} = this.state

    // A children of this extension point throwed an uncaught error
    if (error || errorInfo) {
      return (
        <div className="ExtensionPoint--error">
          <p>Extension point {treePath} failed to render with error:</p>
          <p>{error}</p>
          <p>{errorInfo}</p>
        </div>
      )
    }

    // This extension point is not configured or has no component
    if (!extension || !extension.component) {
      return <span className="ExtensionPoint--empty" />
    }

    // Extensions may have multiple components (HOCs)
    const components = getComponents(extension)
    const Components = getImplementations(components)

    // This extension assets' have not loaded yet,
    // which will be handled by componentDidMount
    // and trigger a re-render when available.
    if (Components.length !== components.length) {
      return (
        <span className="ExtensionPoint--loading">
          {children}
        </span>
      )
    }

    const props = {
      ...parentProps,
      ...extension.props,
    }

    return Components.reduce((acc, Component) => {
      return <Component {...props}>{acc || children}</Component>
    }, null)
  }
}

export default treePath(ExtensionPoint)
