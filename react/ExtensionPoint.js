import React, {Component} from 'react'
import PropTypes from 'prop-types'
import treePath from 'react-tree-path'

import ExtensionPointComponent from './components/ExtensionPointComponent'

const EMPTY_ARRAY = []

class ExtensionPoint extends Component {
  static contextTypes = {
    extensions: PropTypes.object,
    emitter: PropTypes.object,
    registerExtension: PropTypes.func,
    production: PropTypes.bool,
  }

  static propTypes = {
    children: PropTypes.node,
    treePath: PropTypes.string.isRequired,
  }

  constructor(props, context) {
    super()
    this.state = this.getExtensionPointState(props.treePath, context.extensions)
  }

  getExtensionPointState = (treePath, extensions) => {
    const extension = extensions[treePath]
    return {
      component: extension ? extension.component : null,
      props: extension ? extension.props : null,
    }
  }

  updateExtensionPoint = (state) => {
    if (state && state.extensions) {
      this.context.extensions = state.extensions
    }
    this.setState(this.getExtensionPointState(this.props.treePath, this.context.extensions))
  }

  subscribeToTreePath = (treePath) => {
    const {emitter} = this.context
    emitter.addListener(`extension:${treePath}:update`, this.updateExtensionPoint)
  }

  unsubscribeToTreePath = (treePath) => {
    const {emitter} = this.context
    emitter.removeListener(`extension:${treePath}:update`, this.updateExtensionPoint)
  }

  componentDidMount() {
    const {registerExtension, production} = this.context
    const {treePath} = this.props

    registerExtension(treePath)

    if (!production) {
      this.subscribeToTreePath('*')
      this.subscribeToTreePath(treePath)
    }
  }

  componentWillReceiveProps(nextProps) {
    const {production, registerExtension} = this.context

    if (nextProps.treePath !== this.props.treePath) {
      registerExtension(nextProps.treePath)

      if (!production) {
        this.unsubscribeToTreePath(this.props.treePath)
        this.subscribeToTreePath(nextProps.treePath)
      }

      this.setState(this.getExtensionPointState(nextProps.treePath, this.context.extensions))
    }
  }

  componentWillUnmount() {
    const {production} = this.context
    const {treePath} = this.props

    if (!production) {
      this.unsubscribeToTreePath('*')
      this.unsubscribeToTreePath(treePath)
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Failed to render extension point', this.props.treePath, error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    const {children, treePath, ...parentProps} = this.props
    const {component, props: extensionProps, error, errorInfo} = this.state

    delete parentProps.id

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

    const props = {
      ...parentProps,
      ...extensionProps,
    }

    const components = !component
      ? EMPTY_ARRAY
      : Array.isArray(component)
        ? component
        : [component]

    return <ExtensionPointComponent components={components} props={props}>{children}</ExtensionPointComponent>
  }
}

export default treePath(ExtensionPoint)
